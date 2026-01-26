package controllers

import (
	"encoding/json"
	"net/http"
	"time"

	"rtf/config"
	"rtf/models"
	"rtf/pkg"

	"github.com/gorilla/websocket"
)

func (c *Controller) Messages(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	user, er := c.DB.CheckSessionExistance(r)
	if er != nil {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"unauthorized"}`))
		return
	}

	// switch to WS
	conn, err := c.Ws.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"SERVER ERROR"}`))
		return
	}

	// initialize user WS in the map
	c.Ws.Mu.Lock()
	c.Ws.Clients[user.ID] = InitializeUserWS(conn)
	userWS := c.Ws.Clients[user.ID]
	c.Ws.Mu.Unlock()

	//
	defer func() {
		c.Ws.Mu.Lock()
		delete(c.Ws.Clients, user.ID)
		c.Ws.Mu.Unlock()
		close(userWS.Chan)
		conn.Close()
	}()

	WSkeepalive(conn)
	WriteToClient(userWS, conn, c)
	SendPingMessageEveryPeriodeOfTime(userWS)

	for {
		_, p, er := conn.ReadMessage()
		if er != nil {
			break
		}
		if len(p) > config.Max_Size_message {
			continue
		}

		var data models.Message
		er = json.Unmarshal(p, &data)
		if er != nil {
			continue
		}

		if !pkg.TheMessageFormatIsCorrect(data) {
			continue
		}

		// rate limiter
		c.Ws.Mu.Lock()
		rl := userWS.Rate
		now := time.Now()
		// if the user already blocked check time for deblock or continue
		if rl.Blocked {
			if now.After(rl.Deleteblock) {
				rl.Blocked = false
				rl.Count = 0
			} else {
				c.Ws.Mu.Unlock()
				continue
			}
		}
		// block user in case of spumming
		if pkg.MessageRLExceeded(rl.Count, rl.Last) {
			rl.Blocked = true
			rl.Deleteblock = now.Add(10 * time.Second)
			c.Ws.Mu.Unlock()
			continue
		}
		rl.Count++
		rl.Last = now
		c.Ws.Mu.Unlock()

		data.SenderID = user.ID

		// insert the messages to the DB
		m, er := c.DB.InsertMessage(data)
		if er != nil {
			continue
		}

		MSG, err := json.Marshal(map[string]interface{}{
			"message": m,
			"success": "message correctly sent",
		})
		if err == nil {
			userWS.Mu.Lock()
			_ = conn.SetWriteDeadline(time.Now().Add(config.Try_write))
			_ = conn.WriteMessage(websocket.TextMessage, MSG)
			userWS.Mu.Unlock()
		}

		msgByte, er := json.Marshal(m)
		if er != nil {
			continue
		}

		// send the message to the user if he's online
		c.Ws.Mu.RLock()
		toUserWS, exist := c.Ws.Clients[data.ReceiverID]
		c.Ws.Mu.RUnlock()
		if exist {
			select {
			case toUserWS.Chan <- msgByte:
			default:
			}
		}
	}
}
