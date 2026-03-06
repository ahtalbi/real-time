package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"rtf/models"
)

// this handler handles the  user registration. it expects a POST request, and it returns a JSON response with (error or success)
func (c *Controller) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var user models.User
	defer r.Body.Close()

	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "invalid fields", http.StatusBadRequest)
		return
	}

	err = c.DB.InsertUserDB(user)
	if err != nil {
		switch err.Error() {
		case "SERVER ERROR":
			http.Error(w, "SERVER ERROR", http.StatusInternalServerError)
			break
		default:
			http.Error(w, fmt.Sprintf("%s", err.Error()), http.StatusBadRequest)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success": "registered successfully"}`))
}

// this handler is for login. it expects a POST request, and it returns a JSON response with (error or success)
func (c *Controller) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var user models.User
	defer r.Body.Close()

	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "invalid fields", http.StatusBadRequest)
		return
	}

	userID, er := c.DB.IsUserExist(&user)
	if er != nil {
		switch er.Error() {
		case "SERVER ERROR":
			http.Error(w, "SERVER ERROR", http.StatusInternalServerError)
			break
		default:
			http.Error(w, fmt.Sprintf("%s", er.Error()), http.StatusBadRequest)
		}
		return
	}

	user, er = c.DB.GetUserInfos(userID)
	if er != nil {
		http.Error(w, "SERVER ERROR", http.StatusInternalServerError)
		return
	}

	a, er := c.DB.SetUserSession(w, userID)
	if er != nil {
		http.Error(w, "SERVER ERROR", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    a[0].(string),
		Path:     "/",
		HttpOnly: true,
		Expires:  a[1].(time.Time),
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"user":    user,
		"success": "logged in successfully",
	})
}

func (c *Controller) Logout(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"unauthorized"}`))
		return
	}

	c.DB.DisconnectUser(userID)

	c.Ws.Clients[userID].RemoveUserWS(c.Ws, userID)

	http.SetCookie(w, &http.Cookie{
		Name:    "session_id",
		Value:   "",
		Path:    "/",
		Expires: time.Now(),
		MaxAge:  -1,
	})
}
