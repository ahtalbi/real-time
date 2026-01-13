package main

import (
	"fmt"
	"log"
	"net/http"

	"rtf/controllers"
	"rtf/db"
	"rtf/models"
	"rtf/routes"

	"github.com/gorilla/websocket"
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	database, er := db.InitDB()
	if er != nil {
		log.Fatal(er)
	}

	r := &db.Repo{Db: database}
	handler := &routes.Handler{
		Repo: r,
		Cntrlrs: &controllers.Controller{
			DB: r,
			Ws: &controllers.WS{
				WsCon:     make(map[string]*websocket.Conn),
				Broadcast: make(chan []byte),
				Upgrader: websocket.Upgrader{
					ReadBufferSize:  1024,
					WriteBufferSize: 1024,
					CheckOrigin: func(r *http.Request) bool {
						return true
					},
				},
			},
		},
		StatusAndData: &models.UserInfos{LoggedIn: false, User: "", Posts: []models.Post{}, Categories: []string{}},
		LastRL:        make(map[string]*routes.RateLimiter),
	}

	mux := http.NewServeMux()
	routes.Routes(mux, handler)

	server := http.Server{
		Addr:    ":3000",
		Handler: mux,
	}

	fmt.Println("http://localhost:3000")
	log.Fatal(server.ListenAndServe())
}
