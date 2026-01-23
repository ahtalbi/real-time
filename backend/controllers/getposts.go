package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// get a list of posts from the DB and render it to the front
func (c *Controller) GetPosts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req struct {
		Offset int `json:"offset"`
	}
	er := json.NewDecoder(r.Body).Decode(&req)
	if er != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"invalid fields"}`))
		return
	}

	fmt.Println("hre",req)

	posts, er := c.DB.GetPostsfromDB(req.Offset)
	if er != nil {
		fmt.Println("here: ", er)
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
	json.NewEncoder(w).Encode(posts)
}
