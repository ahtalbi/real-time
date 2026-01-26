package controllers

import (
	"encoding/json"
	"net/http"

	"rtf/models"
	"rtf/pkg"
)

// reaction handler
func (c *Controller) Reactions(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"unauthorized"}`))
		return
	}

	var reaction models.Reaction
	if err := json.NewDecoder(r.Body).Decode(&reaction); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"json input invalid"}`))
		return
	}

	var total int

	switch reaction.PostOrComment {

	case "POST":
		er := c.DB.PostExists(reaction.PostorcommentID)
		if er != nil {
			pkg.StatusError(w, er)
			return
		}
		er = c.DB.InsertPostReaction(userID, reaction)
		if er != nil {
			pkg.StatusError(w, er)
			return
		}
		total, er = c.DB.CountPostReactions(reaction.PostorcommentID)
		if er != nil {
			pkg.StatusError(w, er)
			return
		}

	case "COMMENT":
		er := c.DB.CommentExists(reaction.PostorcommentID)
		if er != nil {
			pkg.StatusError(w, er)
			return
		}

		er = c.DB.InsertCommentReaction(userID, reaction)
		if er != nil {
			pkg.StatusError(w, er)
			return
		}
		total, er = c.DB.CountCommentReactions(reaction.PostorcommentID)
		if er != nil {
			pkg.StatusError(w, er)
			return
		}

	default:
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"invalid PostOrComment type"}`))
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"result": "reaction successfully created",
		"total":  total,
		// "userReaction":  type,
	})
}
