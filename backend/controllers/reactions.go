package controllers

import (
	"encoding/json"
	"net/http"

	"rtf/models"
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

	switch reaction.PostOrComment {

	case "POST":
		exist, er := c.DB.PostExists(reaction.PostorcommentID)
		if er != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"DB ERROR"}`))
			return
		}
		if !exist {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error":"post not found"}`))
			return
		}
		er = c.DB.InsertPostReaction(userID, reaction)
		if er != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"DB ERROR"}`))
			return
		}

	case "COMMENT":
		exist, er := c.DB.CommentExists(reaction.PostorcommentID)
		if er != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"DB ERROR"}`))
			return
		}
		if !exist {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error":"comment not found"}`))
			return
		}
		err := c.DB.InsertCommentReaction(userID, reaction)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"DB ERROR"}`))
			return
		}

	default:
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"invalid PostOrComment type"}`))
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"result": "reaction successffully created"}`))
}
