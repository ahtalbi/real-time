package controllers

import (
	"encoding/json"
	"net/http"
	"strconv"
)

// handler serve the index of the html file
func (c *Controller) Home(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "../frontend/h.html")
}

// get a list of posts from the DB and render it to the front
func (c *Controller) GetPosts(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	endID, er := strconv.Atoi((q.Get("endID")))
	if er != nil {
		return
	}

	posts, er := c.DB.GetPosts(endID)

	if er != nil {
		http.Error(w, "DB ERROR", http.StatusInternalServerError)
		return
	}
	if len(posts) == 0 {
		http.Error(w, "no posts", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}
