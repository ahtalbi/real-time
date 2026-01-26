package controllers

import (
	"encoding/json"
	"net/http"
	"rtf/models"
)

func (c *Controller) GetComments(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	w.Header().Set("Content-Type", "application/json")

	var p models.Comment
	er := json.NewDecoder(r.Body).Decode(&p)
	if er != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"invalid input"}`))
		return
	}

	comments, N_comments, er := c.DB.Get10PostComments(p.PostID, p.Offset)
	if er != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"SERVER ERROR"}`))
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"comments":          comments,
		"morecommentsexist": N_comments > p.Offset,
		"success":           "comment successfully fetched",
	})
}
