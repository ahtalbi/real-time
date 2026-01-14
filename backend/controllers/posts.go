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
	// get the user ID
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// get the data from the front
	var post models.Post
	er := json.NewDecoder(r.Body).Decode(&post)
	if er != nil {
		http.Error(w, "json input invalid", http.StatusBadRequest)
		return
	}

	// check if the post content is correct and the categories exists in the DB
	ids, er := c.DB.AreCategoriesCorrect(post.CategoryType)
	if er != nil || !pkg.ArePostInfosCorrect(post) {
		http.Error(w, "incorrect post content", http.StatusBadRequest)
		return
	}

	// insert the post into the DB
	er = c.DB.InsertPostDB(userID, post, ids)
	if er != nil {
		http.Error(w, "DB ERROR", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"result": "post successffully created"}`))
}
