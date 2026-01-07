package main

import (
	"fmt"
	"log"
	"net/http"

	"rtf/config"
	"rtf/db"
	"rtf/routes"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	database, er := db.InitDB()
	if er != nil {
		log.Fatal(er)
	}

	handler := &routes.Handler{
		Repo: &db.Repo{Db: database},
	}

	mux := http.NewServeMux()
	routes.Routes(mux, handler)

	server := http.Server{
		Addr:    config.Port,
		Handler: mux,
	}

	fmt.Println("http://localhost:3000")
	log.Fatal(server.ListenAndServe())
}
