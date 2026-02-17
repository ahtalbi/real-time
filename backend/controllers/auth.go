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

	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, private")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")

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

// logout handler set user session from the DB to null and  return JSON response with (error or success)
func (c *Controller) Logout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, private")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		w.Write([]byte(`{"error":"method not allowed"}`))
		return
	}

	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"Status Unauthorized"}`))
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:  "",
		Value: "",
		Path:  "/",
	})

	err := c.DB.DisconnectUser(userID)
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf(`{"error": "%s"}`, err.Error())))
		return
	}
	c.Ws.Mu.Lock()
	_, ok = c.Ws.Clients[userID]
	if ok {
		delete(c.Ws.Clients, userID)
	}
	c.Ws.Mu.Unlock()
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success": "Logged out successfully"}`))
}
