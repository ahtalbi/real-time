package controllers

import (
	"net/http"
)

func (c *Controller) Messages(w http.ResponseWriter, r *http.Request) {
	conn, err := c.Ws.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	for {
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			return
		}
		if err := conn.WriteMessage(messageType, p); err != nil {
			return
		}
	}
}