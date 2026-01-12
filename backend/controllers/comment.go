package controllers

import (
	"encoding/json"
	"net/http"

	"rtf/models"
	"rtf/pkg"
)

// create comments handler
func (c *Controller) CreateComment(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var comment models.Comment
	if err := json.NewDecoder(r.Body).Decode(&comment); err != nil {
		http.Error(w, "invalid json input", http.StatusBadRequest)
		return
	}
	comment.UserID = userID

	if !pkg.IsvalidComment(comment) {
		http.Error(w, "invalid comment input", http.StatusBadRequest)
		return
	}

	exist, err := c.DB.PostExists(comment.PostID)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	if !exist {
		http.Error(w, "post not found", http.StatusBadRequest)
		return
	}

	if err := c.DB.InsertCommentDB(comment); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"result": "comment successffully created"}`))
}
