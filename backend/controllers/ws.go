package controllers

import (
	"encoding/json"
	"net/http"

	"rtf/config"
	"rtf/models"
	"rtf/pkg"

	"github.com/gorilla/websocket"
)

// switch to WS
func (c *Controller) WebSocket(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	user, er := c.DB.CheckSessionExistance(r)
	if er != nil {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"unauthorized"}`))
		return
	}

	conn, er := c.Ws.Upgrader.Upgrade(w, r, nil)
	if er != nil {
		return
	}
	c.Ws.Connection(conn, r, c, user)
}

// handle ws connection
func (ws *WS) Connection(conn *websocket.Conn, r *http.Request, c *Controller, USER models.User) {
	// initialise the user ws
	c.Ws.Mu.Lock()
	c.Ws.Clients[USER.ID] = InitializeUserWS(conn, USER)
	user := c.Ws.Clients[USER.ID]
	c.Ws.Mu.Unlock()

	defer user.RemoveUserWS(ws, USER.ID, conn)
	go user.Write()
	WSkeepalive(conn)
	user.SendPingMessageEveryPeriodeOfTime()

	for {
		_, data, er := conn.ReadMessage()
		if er != nil {
			break
		}

		var Data map[string]interface{}
		if er := json.Unmarshal(data, &Data); er != nil {
			continue
		}

		switch Data["type"] {
		// case of new message received or sent
		case "message":
			msgRaw, ok := Data["message"].(map[string]interface{})
			if !ok {
				continue
			}

			content, ok := msgRaw["Content"].(string)
			if !ok || !pkg.TheMessageFormatIsCorrect(msgRaw) || len(content) > config.Max_Size_message {
				continue
			}

			ws.Mu.Lock()
			if !user.RateLimit.Check() {
				ws.Mu.Unlock()
				continue
			}

			msgRaw["SenderID"] = USER.ID
			m, er := c.DB.InsertMessage(msgRaw)
			ws.Mu.Unlock()
			if er != nil {
				continue
			}

			Data["message"] = m

			ws.Mu.Lock()
			toUserWS, exist := ws.Clients[m.ReceiverID]
			ws.Mu.Unlock()
			if exist {
				select {
				case toUserWS.Chan <- Data:
				default:
				}
			}

		// case of typing status
		case "typing":
			receiverID, ok := Data["receiverID"].(string)
			if !ok {
				continue
			}
			status, ok := Data["Status"].(string)
			if !ok {
				continue
			}

			ws.Mu.Lock()
			toUserWS, exist := ws.Clients[receiverID]
			ws.Mu.Unlock()
			if exist {
				select {
				case toUserWS.Chan <- map[string]interface{}{
					"type":   "typing",
					"from":   USER.ID,
					"status": status, // status here is "start-typing" or "stop-typing"
				}:
				default:
				}
			}

		// case of get users for chat
		case "get_users_chat":
			startID, ok := Data["StartID"].(float64)
			if !ok {
				startID = 0
			}
			users, er := c.DB.GetUsersForChatInOrder(USER.ID, int(startID))
			if er != nil {
				continue
			}
			select {
			case user.Chan <- map[string]interface{}{
				"type": "users_chat",
				"data": users,
			}:
			default:
			}
		// case of get online users
		case "online_users":
			ws.Mu.Lock()
			onlineUsers := []map[string]string{}
			for id, u := range ws.Clients {
				if id != USER.ID {
					onlineUsers = append(onlineUsers, map[string]string{
						"id":       u.UserInfo.ID,
						"nickname": u.UserInfo.Nickname,
					})
				}
			}
			ws.Mu.Unlock()

			select {
			case user.Chan <- map[string]interface{}{
				"type": "onlineUsers",
				"data": onlineUsers,
			}:
			default:
			}

		// case of get messages between two users
		case "messages_history":
			receiverID, ok := Data["receiverID"].(string)
			if !ok {
				continue
			}

			si, ok := Data["StartID"].(float64)
			startID := 0
			if ok {
				startID = int(si)
			}

			msgs, er := c.DB.GetMessagesHistoryBetweenTwoUsers(USER.ID, receiverID, startID)
			if er != nil {
				continue
			}

			select {
			case user.Chan <- map[string]interface{}{
				"type": "messages_history",
				"data": msgs,
			}:
			default:
			}

		default:
		}
	}
}
