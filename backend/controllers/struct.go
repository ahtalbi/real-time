package controllers

import (
	"sync"
	"time"

	"rtf/db"

	"github.com/gorilla/websocket"
)

type Controller struct {
	DB *db.Repo
	Ws *WS
}

// the rate limiter struct for the messages
type Msgrl struct {
	Last              time.Time
	Count             int
	blocked           bool
	timetoRemoveBlock time.Time
}

// active websocket connections management
type WS struct {
	WsCon          map[string]*websocket.Conn
	Channels       map[string]chan []byte
	Upgrader       websocket.Upgrader
	Mu             sync.Mutex
	MsgRateLimiter map[string]*Msgrl
}
