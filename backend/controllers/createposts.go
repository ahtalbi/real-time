package controllers

import (
	"encoding/json"
	"fmt"
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
		w.Write([]byte(`{"error":"invalid fields"}`))
		return
	}

	// check if the post content is correct and the category exists in the DB
	id, er := c.DB.IsCategoryCorrect(post.CategoryType)
	if er != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf(`{"error":"%s"}`, er.Error())))
		return
	}
	er = pkg.ArePostInfosCorrect(post)
	if er != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf(`{"error":"%s"}`, er.Error())))
		return
	}

	// insert the post into the DB
	post, er = c.DB.InsertPostDB(userID, post, id)
	if er != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf(`{"error":"%s"}`, er.Error())))
		return
	}

	post.AutherName, er = c.DB.GetNicknameByUserID(userID)
	if er != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf(`{"error":"%s"}`, er.Error())))
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"post":    post,
		"success": "post successfully created",
	})
}
