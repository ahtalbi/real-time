package routes

import (
	"time"

	"rtf/controllers"
	"rtf/db"
	"rtf/models"
)

type RateLimiter struct {
	LastTime time.Time
	Counter  int
}

type Handler struct {
	Repo          *db.Repo
	Cntrlrs       *controllers.Controller
	StatusAndData *models.UserInfos
	LastRL        map[string]*RateLimiter
}
