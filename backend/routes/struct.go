package routes

import (
	"rtf/controllers"
	"rtf/db"
)

type Handler struct {
	Repo *db.Repo
	Cntrlrs *controllers.Controller
}
