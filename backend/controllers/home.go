package controllers

import (
	"net/http"
)

func (c *Controller) Home(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "../frontend/h.html")
}
