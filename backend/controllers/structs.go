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
func (u *UserWS) SendPingMessageEveryPeriodeOfTime(fn func(), ws *WS) {
	t := time.NewTicker(config.Ping)
	go func() {
		defer t.Stop()
		for range t.C {
			u.Mu.Lock()
			_ = u.Con.SetWriteDeadline(time.Now().Add(config.Try_write))
			er := u.Con.WriteMessage(websocket.PingMessage, nil)
			u.Mu.Unlock()
			if er != nil {
				u.RemoveUserWS(ws, u.UserInfo.ID)
				fn()
				return
			}
		}
	}()
}

// this function remove the user websocket from the map and close the connection
func (u *UserWS) RemoveUserWS(ws *WS, userID string) {
	u.CloseOnce.Do(func() {
		ws.Mu.Lock()
		if c, ok := ws.Clients[userID]; ok && c == u {
			delete(ws.Clients, userID)
		}
		close(u.Chan)
		_ = u.Con.Close()
		ws.Mu.Unlock()
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
