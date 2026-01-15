package controllers

import (
	"encoding/json"
	"net/http"

	"rtf/models"
	"rtf/pkg"
)

// handle create post
func (c *Controller) CreatePost(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	w.Header().Set("Content-Type", "application/json")

	// get the user ID
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"unauthorized"}`))
		return
	}

	// get the data from the front
	var post models.Post
	er := json.NewDecoder(r.Body).Decode(&post)
	if er != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"json input invalid"}`))
		return
	}

	// check if the post content is correct and the categories exists in the DB
	ids, er := c.DB.AreCategoriesCorrect(post.CategoryType)
	if er != nil || !pkg.ArePostInfosCorrect(post) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"incorrect post content"}`))
		return
	}

	// insert the post into the DB
	er = c.DB.InsertPostDB(userID, post, ids)
	if er != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"DB ERROR"}`))
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"result": "post successffully created"}`))
}
