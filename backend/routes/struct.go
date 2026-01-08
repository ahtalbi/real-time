package routes

import (
	"rtf/controllers"
	"rtf/db"
	"rtf/models"
)

type Handler struct {
	Repo          *db.Repo
	Cntrlrs       *controllers.Controller
	StatusAndData *models.UserInfos
}
