package controllers

import (
	"encoding/json"
	"sync"
	"time"

	"rtf/config"
	"rtf/db"
	"rtf/models"
	"rtf/pkg"

	"github.com/gorilla/websocket"
)

type Controller struct {
	DB *db.Repo
	Ws *WS
}

type WS struct {
	Upgrader websocket.Upgrader
	Mu       sync.RWMutex
	Clients  map[string]*UserWS
}

// rate limiter struct and methods for websocket messages
type RateLimiter struct {
	Last        time.Time
	Count       int
	Blocked     bool
	Deleteblock time.Time
}

func (rl *RateLimiter) Check() bool {
	now := time.Now()
	if rl.Blocked {
		if now.After(rl.Deleteblock) {
			rl.Blocked = false
			rl.Count = 0
		} else {
			return false
		}
	}

	if pkg.MessageRLExceeded(rl.Count, rl.Last) {
		rl.Blocked = true
		rl.Deleteblock = now.Add(10 * time.Second)
		return false
	}

	rl.Count++
	rl.Last = now
	return true
}

// handle each user websocket connection separately
type UserWS struct {
	Con       *websocket.Conn
	Chan      chan map[string]interface{}
	RateLimit *RateLimiter
	Mu        *sync.Mutex
	UserInfo  *models.User
	CloseOnce sync.Once
}

// sent a ping message to the client every periode of time to keep the connection alive
func (u *UserWS) SendPingMessageEveryPeriodeOfTime() {
	t := time.NewTicker(config.Ping)
	go func() {
		defer t.Stop()
		for range t.C {
			u.Mu.Lock()
			_ = u.Con.SetWriteDeadline(time.Now().Add(config.Try_write))
			er := u.Con.WriteMessage(websocket.PingMessage, nil)
			u.Mu.Unlock()
			if er != nil {
				return
			}
		}
	}()
}

// this function remove the user websocket from the map and close the connection
func (u *UserWS) RemoveUserWS(ws *WS, userID string, conn *websocket.Conn) {
	u.CloseOnce.Do(func() {
		ws.Mu.Lock()
		delete(ws.Clients, userID)
		ws.Mu.Unlock()

		close(u.Chan)
		conn.Close()
	})
}

// write messages to the client
func (u *UserWS) Write() {
	for msg := range u.Chan {
		data, er := json.Marshal(msg)
		if er != nil {
			continue
		}

		u.Mu.Lock()
		_ = u.Con.SetWriteDeadline(time.Now().Add(config.Try_write))
		er = u.Con.WriteMessage(websocket.TextMessage, data)
		u.Mu.Unlock()
		if er != nil {
			break
		}
	}
}

// broadcast message to all connected clients
func (ws *WS) Broadcast(msg map[string]interface{}) {
	ws.Mu.RLock()
	defer ws.Mu.RUnlock()

	for _, client := range ws.Clients {
		switch msg["type"] {
		case "message":
			select {
			case client.Chan <- msg:
			default:
			}
		case "get_users_chat", "get_messages":
		}
	}
}

// return online users list excluding the provided user id
func (ws *WS) OnlineUsersFor(excludeUserID string) []map[string]string {
	ws.Mu.RLock()
	defer ws.Mu.RUnlock()

	onlineUsers := make([]map[string]string, 0, len(ws.Clients))
	for id, u := range ws.Clients {
		if id == excludeUserID {
			continue
		}
		onlineUsers = append(onlineUsers, map[string]string{
			"id":       u.UserInfo.ID,
			"nickname": u.UserInfo.Nickname,
		})
	}
	return onlineUsers
}

// send refreshed online users to all connected clients
func (ws *WS) BroadcastOnlineUsers() {
	ws.Mu.RLock()
	clients := make(map[string]*UserWS, len(ws.Clients))
	for id, client := range ws.Clients {
		clients[id] = client
	}
	ws.Mu.RUnlock()

	for currentID, client := range clients {
		select {
		case client.Chan <- map[string]interface{}{
			"type": "onlineUsers",
			"data": ws.OnlineUsersFor(currentID),
		}:
		default:
		}
	}
}
