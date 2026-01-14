package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func (c *Controller) Messages(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	user, er := c.DB.CheckSessionExistance(r)
	if er != nil {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"unauthorized"}`))
		return
	}

	// switch to websocket
	conn, err := c.Ws.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	// add conn to the map
	c.Ws.Mu.Lock()
	c.Ws.WsCon[user.FrontID] = conn
	c.Ws.Mu.Unlock()

	// if connexion closed, user should be removed from the map
	defer func() {
		c.Ws.Mu.Lock()
		delete(c.Ws.WsCon, user.FrontID)
		c.Ws.Mu.Unlock()
	}()

	for {
		// read the message
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			return
		}
		var data map[string]interface{}
		err = json.Unmarshal(p, &data)

		to, er := c.DB.GetUserByFrontID(data["front_id_to"].(string))
		if er != nil {
			return
		}

		fmt.Println(data["msg"])

		// insert msg to the DB
		er = c.DB.InertMessage(user.ID, to, data["msg"].(string))
		if er != nil {
			return
		}

		// send the msg to the front
		c.Ws.Mu.Lock()
		ct, exist := c.Ws.WsCon[to]
		c.Ws.Mu.Unlock()

		fmt.Println(c.Ws.WsCon)
		if exist {
			fmt.Println("it is exist")
			if err := ct.WriteMessage(messageType, p); err != nil {
				return
			}
		}

	}
}
