package controllers

import (
	"sync"
	"time"

	"rtf/config"
	"rtf/db"

	"github.com/gorilla/websocket"
)

type Controller struct {
	DB *db.Repo
	Ws *WS
}

type RateLimiter struct {
	Last        time.Time
	Count       int
	Blocked     bool
	Deleteblock time.Time
}

type UserWS struct {
	Con  *websocket.Conn
	Chan chan []byte
	Rate *RateLimiter
	Mu   *sync.Mutex
}

type WS struct {
	Upgrader websocket.Upgrader
	Mu       sync.RWMutex
	Clients  map[string]*UserWS
}

// initialize the userWS properties
func InitializeUserWS(conn *websocket.Conn) *UserWS {
	return &UserWS{
		Con:  conn,
		Chan: make(chan []byte, 32),
		Mu:   &sync.Mutex{},
		Rate: &RateLimiter{
			Count: 0,
			Last:  time.Now(),
		},
	}
}

// the websocket package handles pong messages by calling the PongHandler, it reinisialize conn ReadDeadline
func WSkeepalive(conn *websocket.Conn) {
	conn.SetReadLimit(config.MESSAGE_SIZE_READ_LIMIT)
	conn.SetReadDeadline(time.Now().Add(config.Pong))
	conn.SetPongHandler(func(string) error {
		_ = conn.SetReadDeadline(time.Now().Add(config.Pong))
		return nil
	})
}

// try to write the messages exists in the user chan to the clients, also handle WriteDeadline
func WriteToClient(userchan *UserWS, conn *websocket.Conn, c *Controller) {
	go func() {
		for msg := range userchan.Chan {
			userchan.Mu.Lock()
			_ = conn.SetWriteDeadline(time.Now().Add(config.Try_write))
			er := conn.WriteMessage(websocket.TextMessage, msg)
			userchan.Mu.Unlock()
			if er != nil {
				return
			}
		}
	}()
}

// sent a ping message to the client every periode of time
func SendPingMessageEveryPeriodeOfTime(userws *UserWS) {
	t := time.NewTicker(config.Ping)
	go func() {
		defer t.Stop()
		for range t.C {
			userws.Mu.Lock()
			_ = userws.Con.SetWriteDeadline(time.Now().Add(config.Try_write))
			er := userws.Con.WriteMessage(websocket.PingMessage, nil)
			userws.Mu.Unlock()
			if er != nil {
				return
			}
		}
	}()
}
