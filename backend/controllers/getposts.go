package controllers

import (
	"encoding/json"
	"net/http"
)

// get a list of posts from the DB and render it to the front
func (c *Controller) GetPosts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"unauthorized"}`))
		return
	}

	var req struct {
		Offset int `json:"offset"`
	}

	er := json.NewDecoder(r.Body).Decode(&req)
	if er != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"invalid fields"}`))
		return
	}

	posts, er := c.DB.Get10PostsfromDB(userID, req.Offset)

	if er != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"SERVER ERROR"}`))
		return
	}

	if len(posts) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"no posts"}`))
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"posts":   posts,
		"success": "Posts fetched successfully",
	})
}
