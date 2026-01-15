package controllers

import (
	"net/http"
)

// handler serve the index of the html file
func (c *Controller) Home(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "../frontend/h.html")
}
