package controllers

import (
	"encoding/json"
	"net/http"
)

func (c *Controller) HasSession(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		w.Write([]byte(`{"error":"method not allowed"}`))
		return
	}

	_, er := c.DB.CheckSessionExistance(r)
	if er != nil {
		// w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"session not found"}`))
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": "session found successfully",
	})
}
