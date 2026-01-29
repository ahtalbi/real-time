package controllers

import (
	"sync"
	"time"

	"rtf/config"
	"rtf/models"

	"github.com/gorilla/websocket"
)

// initialize the userWS properties
func InitializeUserWS(conn *websocket.Conn, user models.User) *UserWS {
	return &UserWS{
		Con:  conn,
		Chan: make(chan map[string]interface{}, 1000),
		Mu:   &sync.Mutex{},
		RateLimit: &RateLimiter{
			Count: 0,
			Last:  time.Now(),
		},
		UserInfo: &user,
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