package controllers

import (
	"encoding/json"
	"net/http"
)

// get a list of users from DB and send it to the front
func (c *Controller) Getusers(w http.ResponseWriter, r *http.Request) {
	users, er := c.DB.GetAllUsers()
	if er != nil {
		return
	}

	data, er := json.Marshal(users)
	if er != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"marchal ERROR"}`))
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(data)
}
