package routes

import (
	"time"

	"rtf/controllers"
	"rtf/db"
)

type RateLimiter struct {
	LastTime time.Time
	Counter  int
}

type Handler struct {
	Repo    *db.Repo
	Cntrlrs *controllers.Controller

	// ratelimiter for http
	LastRL map[string]*RateLimiter
}
