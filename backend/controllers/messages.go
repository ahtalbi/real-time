package controllers

import (
	"encoding/json"
	"net/http"
	"time"

	"rtf/pkg"
)

// Messages handler
func (c *Controller) Messages(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	//
	user, er := c.DB.CheckSessionExistance(r)
	if er != nil {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"unauthorized"}`))
		return
	}

	// switch to websocket
	conn, err := c.Ws.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"WebSocket ERROR"}`))
		return
	}
	userChannel := make(chan []byte)

	// save user connection and channel in the maps
	c.Ws.Mu.Lock()
	c.Ws.WsCon[user.FrontID] = conn
	c.Ws.Channels[user.FrontID] = userChannel
	c.Ws.Mu.Unlock()

	// if connexion closed, user should be removed from the maps
	defer func() {
		c.Ws.Mu.Lock()
		delete(c.Ws.WsCon, user.FrontID)
		delete(c.Ws.Channels, user.FrontID)
		c.Ws.Mu.Unlock()
		close(userChannel)
		conn.Close()
	}()

	// write the messages saved in the channel to the specific user
	go func() {
		for msg := range userChannel {
			_ = conn.WriteMessage(1, msg)
		}
	}()

	for {
		_, p, err := conn.ReadMessage()
		if err != nil {
			continue
		}

		// here is the handling of the rate limiter
		u, ok := c.Ws.MsgRateLimiter[user.FrontID]
		if !ok {
			c.Ws.MsgRateLimiter[user.FrontID] = &Msgrl{
				Count:             1,
				Last:              time.Now(),
				blocked:           false,
				timetoRemoveBlock: time.Now(),
			}
			u = c.Ws.MsgRateLimiter[user.FrontID]
		} else {
			// remove block if 10 sec passed
			if u.blocked {
				if time.Now().After(u.timetoRemoveBlock) {
					u.blocked = false
					u.Count = 0
				} else {
					continue
				}
			}
			// set block in case of message spam
			if pkg.MessageRLExceeded(u.Count, u.Last) {
				u.blocked = true
				u.timetoRemoveBlock = time.Now().Add(10 * time.Second)
				continue
			}
			u.Count++
			u.Last = time.Now()
		}

		//
		var data map[string]interface{}
		if err := json.Unmarshal(p, &data); err != nil {
			continue
		}

		// get the infos of the user (receiver)
		to_frontID, ok := data["front_id_to"].(string)
		if !ok {
			continue
		}
		toID, er := c.DB.GetUserByFrontID(to_frontID)
		if er != nil {
			continue
		}

		// write the message to the DB
		er = c.DB.InertMessage(user.ID, toID, data["msg"].(string))
		if er != nil {
			continue
		}

		//
		msgByte, er := json.Marshal(map[string]interface{}{"front_id_from": user.FrontID, "msg": data["msg"].(string)})
		if er != nil {
			continue
		}

		// send the message to the receiver if he's on line
		c.Ws.Mu.Lock()
		to, exist := c.Ws.Channels[to_frontID]
		c.Ws.Mu.Unlock()

		if exist {
			select {
			case to <- msgByte:
			default:
			}
		}
	}
}
