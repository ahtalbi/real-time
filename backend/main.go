package main

import (
	"fmt"
	"log"
	"net/http"

	"rtf/controllers"
	"rtf/db"
	"rtf/models"
	"rtf/routes"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	database, er := db.InitDB()
	if er != nil {
		log.Fatal(er)
	}

	r := &db.Repo{Db: database}
	handler := &routes.Handler{
		Repo:          r,
		Cntrlrs:       &controllers.Controller{DB: r},
		StatusAndData: &models.UserInfos{LoggedIn: false, User: "", Posts: []models.Post{}, Categories: []string{}},
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
