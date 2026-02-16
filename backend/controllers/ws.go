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

	ws.BroadcastOnlineUsers()
	defer func() {
		user.RemoveUserWS(ws, USER.ID, conn)
		ws.BroadcastOnlineUsers()
	}()
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
			break

		// case of receiving and reading message in place
		case "message_read_in_place":
			_, ok := Data["receiverID"].(string)
			if !ok {
				continue
			}
			senderID, ok := Data["senderID"].(string)
			if !ok {
				continue
			}
			er = c.DB.SetMessageRead(senderID, USER.ID)
			if er != nil {
				continue
			}
			break
			
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
			break

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
			break
		// case of get online users
		case "online_users":
			select {
			case user.Chan <- map[string]interface{}{
				"type": "onlineUsers",
				"data": ws.OnlineUsersFor(USER.ID),
			}:
			default:
			}
			break
		case "users_info_for_user":

			usersinfo, er := c.DB.GetUsersInfoFor(USER.ID)
			if er != nil {
				continue
			}
			for i, u := range usersinfo {
				if _, ok := c.Ws.Clients[u.ID]; ok {
					usersinfo[i].IsOnline = true
				}
			}

			select {
			case user.Chan <- map[string]interface{}{
				"type": "users_info_for_user",
				"data": usersinfo,
			}:
			default:
			}

			break
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
			break

		default:
		}
	}
}
