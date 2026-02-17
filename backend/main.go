package main

import (
	"fmt"
	"log"
	"net/http"
	"sync"

	"rtf/controllers"
	"rtf/db"
	"rtf/routes"

	"github.com/gorilla/websocket"
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	database, er := db.InitDB()
	if er != nil {
		log.Fatal(er)
	}

	// initialize
	r := &db.Repo{Db: database}

	ws := &controllers.WS{
		Upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin:     func(r *http.Request) bool { return true },
		},
		Clients: make(map[string][]*controllers.UserWS),
		Mu:      sync.RWMutex{},
	}

	controller := &controllers.Controller{
		DB: r,
		Ws: ws,
	}

	handler := &routes.Handler{
		Repo:    r,
		LastRL:  make(map[string]*routes.RateLimiter),
		Cntrlrs: controller,
	}

	mux := http.NewServeMux()
	routes.Routes(mux, handler)

	server := http.Server{
		Addr:    ":3000",
		Handler: mux,
	}
	fmt.Print("http://localhost:3000")

	log.Fatal(server.ListenAndServe())
}
