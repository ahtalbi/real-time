package controllers

import (
	"encoding/json"
	"net/http"
)

// get a list of users from DB and send it to the front
func (c *Controller) Getusers(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	w.Header().Set("Content-Type", "application/json")
	// get the user ID
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"status unauthorized"}`))
		return
	}

	// get the body of the request
	var req struct {
		StartID int `json:"startID"`
	}

	er := json.NewDecoder(r.Body).Decode(&req)
	if er != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"SERVER ERROR"}`))
		return
	}

	// get 100 users from DB
	users, er := c.DB.Get100UsersFor(userID, req.StartID)
	if er != nil {
		switch er.Error() {
		case "SERVER ERROR":
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"SERVER ERROR"}`))
			break
		default:
			w.Write([]byte(`{"error":"startID reached the max"}`))
		}
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data":    users,
		"success": "data fetched successfully",
	})
}