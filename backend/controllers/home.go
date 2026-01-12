package controllers

import (
	"encoding/json"
	"net/http"
	"strconv"
)

// home hanfdler
func (c *Controller) Home(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "../frontend/h.html")
}

// the home will be accessible by all users, regardless of whether they are logged in or not, so some posts will be rendred automatically
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
