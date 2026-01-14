package controllers

import (
	"sync"

	"rtf/db"

	"github.com/gorilla/websocket"
)

type Controller struct {
	DB *db.Repo
	Ws *WS
}

// active websocket connections management
type WS struct {
	WsCon     map[string]*websocket.Conn
	Broadcast chan []byte
	Upgrader  websocket.Upgrader
	Mu        sync.Mutex
}
