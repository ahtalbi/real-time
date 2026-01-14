package controllers

import (
	"encoding/json"
	"net/http"

	"rtf/models"
)

// reaction handler
func (c *Controller) Reactions(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var reaction models.Reaction
	if err := json.NewDecoder(r.Body).Decode(&reaction); err != nil {
		http.Error(w, "invalid json input", http.StatusBadRequest)
		return
	}

	switch reaction.PostOrComment {

	case "POST":
		exist, er := c.DB.PostExists(reaction.PostorcommentID)
		if er != nil {
			http.Error(w, "DB ERROR", http.StatusInternalServerError)
			return
		}
		if !exist {
			http.Error(w, "post not exist", http.StatusBadRequest)
			return
		}
		er = c.DB.InsertPostReaction(userID, reaction)
		if er != nil {
			http.Error(w, "DB ERROR", http.StatusInternalServerError)
			return
		}

	case "COMMENT":
		exist, er := c.DB.CommentExists(reaction.PostorcommentID)
		if er != nil {
			http.Error(w, "DB ERROR", http.StatusInternalServerError)
			return
		}
		if !exist {
			http.Error(w, "comment not found", http.StatusBadRequest)
			return
		}
		err := c.DB.InsertCommentReaction(userID, reaction)
		if err != nil {
			http.Error(w, "DB ERROR", http.StatusInternalServerError)
			return
		}

	default:
		http.Error(w, "invalid PostOrComment type", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"result": "reaction successffully created"}`))
}
