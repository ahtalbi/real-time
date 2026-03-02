package controllers

import (
	"encoding/json"
	"net/http"
)

func (c *Controller) Logout(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	// get the user ID
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	c.DB.DisconnectUser(userID)

	http.SetCookie(w, &http.Cookie{
		Name:   "",
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	})

	c.Ws.Clients[userID].RemoveUserWS(c.Ws, userID, c.Ws.Clients[userID].Con)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": "logout successfully",
	})
}
