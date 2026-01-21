package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"rtf/models"
	"rtf/pkg"
)

// create comments handler
func (c *Controller) CreateComment(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"unauthorized"}`))
		return
	}

	var comment models.Comment
	if err := json.NewDecoder(r.Body).Decode(&comment); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"json input invalid"}`))
		return
	}
	comment.UserID = userID

	if !pkg.IsvalidComment(comment) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"invalid comment input"}`))
		return
	}

	exist, err := c.DB.PostExists(comment.PostID)
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"DB ERROR"}`))
		return
	}
	if !exist {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"post not found"}`))
		return
	}

	if err := c.DB.InsertCommentDB(comment); err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"DB ERROR"}`))
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"result": "comment successffully created"}`))
}
