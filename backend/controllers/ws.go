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

	annonceusers := func() {
		c.Ws.Mu.Lock()
		if len(ws.Clients) == 0 {
			c.Ws.Mu.Unlock()
			return
		}

		clients := make([]*UserWS, 0, len(ws.Clients))
		for _, client := range ws.Clients {
			clients = append(clients, client)
		}
		c.Ws.Mu.Unlock()

		for _, client := range clients {
			usersinfo, er := c.DB.GetUsersInfoFor(client.UserInfo.ID, true)
			if er != nil {
				continue
			}
			usersinfo = pkg.SortUsers(usersinfo)

			c.Ws.Mu.Lock()
			for i, u := range usersinfo {
				if _, ok := c.Ws.Clients[u.ID]; ok {
					usersinfo[i].IsOnline = true
				} else {
					usersinfo[i].IsOnline = false
				}
			}

			if client != nil && client.Chan != nil {
				select {
				case client.Chan <- map[string]interface{}{
					"type": "ws_users_info_for_user",
					"data": usersinfo,
				}:
				default:
				}
			}
			c.Ws.Mu.Unlock()
		}
	}

	defer func() {
		user.RemoveUserWS(ws, USER.ID)
	}()
	go user.Write()
	WSkeepalive(conn)
	user.SendPingMessageEveryPeriodeOfTime(annonceusers, ws)

	for {
		_, data, er := conn.ReadMessage()

		if er != nil {
			user.RemoveUserWS(ws, USER.ID)
			annonceusers()
			break
		}

		var Data map[string]interface{}
		if er := json.Unmarshal(data, &Data); er != nil {
			continue
		}
		switch Data["type"] {
		// case of new message received or sent
		case "ws_message":
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
			s, isexist := ws.Clients[USER.ID]

			if isexist && s.Chan != nil {
				select {
				case s.Chan <- Data:
				default:
				}
			}

			if exist && toUserWS.Chan != nil {
				select {
				case toUserWS.Chan <- Data:
				default:
				}
			}

			ws.Mu.Unlock()
			break

		// case of receiving and reading message in place
		case "ws_message_read_in_place":
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
		case "ws_typing":
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
			if exist && toUserWS.Chan != nil {
				select {
				case toUserWS.Chan <- map[string]interface{}{
					"type":   "ws_typing",
					"from":   USER.ID,
					"status": status, // status here is "start-typing" or "stop-typing"
				}:
				default:
				}
			}
			ws.Mu.Unlock()
			break

		// case of get users for chat
		case "ws_get_users_chat":
			startID, ok := Data["StartID"].(float64)
			if !ok {
				startID = 0
			}
			users, er := c.DB.GetUsersForChatInOrder(USER.ID, int(startID))
			if er != nil {
				continue
			}
			ws.Mu.Lock()
			if user.Chan != nil {
				select {
				case user.Chan <- map[string]interface{}{
					"type": "ws_users_chat",
					"data": users,
				}:
				default:
				}
			}
			ws.Mu.Unlock()
			break
			// case of get users info for the user and for all users if "for_all_users" is true
		case "ws_users_info_for_user":
			_, ok := Data["for_all_users"].(bool)
			if ok {
				annonceusers()
				break
			} else {
				usersinfo, er := c.DB.GetUsersInfoFor(USER.ID, ok)
				if er != nil {
					continue
				}
				usersinfo = pkg.SortUsers(usersinfo)
				ws.Mu.Lock()
				for i, u := range usersinfo {
					if _, ok := c.Ws.Clients[u.ID]; ok {
						usersinfo[i].IsOnline = true
					} else {
						usersinfo[i].IsOnline = false
					}
				}

				if user != nil && user.Chan != nil {
					select {
					case user.Chan <- map[string]interface{}{
						"type": "ws_users_info_for_user",
						"data": usersinfo,
					}:
					default:
					}
				}
				ws.Mu.Unlock()
			}

			break
			// case of get messages between two users
		case "ws_messages_history":
			receiverID, ok := Data["receiverID"].(string)
			if !ok {
				continue
			}
			tabUUID, _ := Data["tab_uuid"].(string)

			si, ok := Data["StartID"].(float64)
			startID := 0
			if ok {
				startID = int(si)
			}

			msgs, er := c.DB.GetMessagesHistoryBetweenTwoUsers(USER.ID, receiverID, startID)
			if er != nil {
				continue
			}

			ws.Mu.Lock()
			if user.Chan != nil {
				select {
				case user.Chan <- map[string]interface{}{
					"type":     "ws_messages_history",
					"data":     msgs,
					"tab_uuid": tabUUID,
				}:
				default:
				}
			}
			ws.Mu.Unlock()
			break
		case "ws_logout":
			c.DB.DisconnectUser(USER.ID)

			ws.Mu.Lock()
			for _, client := range ws.Clients {
				if client.Chan != nil {
					select {
					case client.Chan <- map[string]interface{}{
						"type":   "ws_user_offline",
						"userID": USER.ID,
					}:
					default:
					}
				}
			}
			if user.Chan != nil {
				select {
				case user.Chan <- map[string]interface{}{"type": "ws_logout_success"}:
				default:
				}
			}
			user.RemoveUserWS(ws, USER.ID)
			ws.Mu.Unlock()
			break
		default:
		}
	}
}
