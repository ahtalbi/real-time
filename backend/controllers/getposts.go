package controllers

import (
	"encoding/json"
	"net/http"
	"strconv"
)

// get a list of posts from the DB and render it to the front
func (c *Controller) GetPosts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	q := r.URL.Query()

	endID, er := strconv.Atoi((q.Get("endID")))
	if er != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"atoi ERROR"}`))
		return
	}

	posts, er := c.DB.GetPosts(endID)

	if er != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"DB ERROR"}`))
		return
	}
	if len(posts) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"no posts"}`))
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(posts)
}
