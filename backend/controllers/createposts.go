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
	f, h, er := r.FormFile("Image")

	if er == nil {
		if !pkg.IsPictureFormatCorrect(f, h) {
			http.Error(w, "picture size or type not authorized", http.StatusBadRequest)
			return
		}

		defer f.Close()
		filename := pkg.SaveFile(f, h.Filename)
		if filename != "" {
			post.ImageURL = "/pics/" + filename
		}
	}

	post.Content = r.FormValue("Content")
	post.CategoryType = r.FormValue("CategoryType")

	// check if the post content is correct and the category exists in the DB
	ids, er := c.DB.IsCategoryCorrect(post.CategoryType)
	if er != nil {
		http.Error(w, "categories is mendatory", http.StatusBadRequest)
		return
	}
	er = pkg.ArePostInfosCorrect(post)
	if er != nil {
		http.Error(w, "post not valid try again", http.StatusBadRequest)
		return
	}

	// insert the post into the DB
	post, er = c.DB.InsertPostDB(userID, post, ids)
	if er != nil {
		http.Error(w, "Server Error", http.StatusInternalServerError)
		return
	}

	er = c.DB.GetUserNickNameByID(&post.AutherName, userID)
	if er != nil {
		http.Error(w, "Server Error", http.StatusInternalServerError)
		return
	}
	post.UserReaction = -1
	post.NbrOfReactions = 0

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"post":    post,
		"success": "post successfully created",
	})
}
