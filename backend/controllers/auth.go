package controllers

import (
	"encoding/json"
	"net/http"
	"time"

	"rtf/models"
)

// register
func (c *Controller) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var user models.User
	defer r.Body.Close()

	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "invalid user infos", http.StatusBadRequest)
		return
	}

	err = c.DB.InsertUserDB(user)
	if err != nil {
		switch err.Error() {
		case "USER ALREADY EXIST":
			http.Error(w, err.Error(), http.StatusBadRequest)
			break
		case "INCORRECT INFOS":
			http.Error(w, err.Error(), http.StatusBadRequest)
			break
		default:
			http.Error(w, "DB ERROR", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"result": "registered successfully"}`))
}

// login handler
func (c *Controller) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var user models.User
	defer r.Body.Close()

	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "invalid user infos", http.StatusBadRequest)
		return
	}

	userID, er := c.DB.IsUserExist(&user)
	if er != nil {
		switch er.Error() {
		case "USER NOT EXIST", "PASSWORD INCORRECT":
			http.Error(w, "user not exists or incorrect password", http.StatusBadRequest)
			break
		default:
			http.Error(w, "DB ERROR", http.StatusInternalServerError)
		}
		return
	}

	a, er := c.DB.SetUserSession(w, userID)
	if er != nil {
		http.Error(w, "DB ERROR", http.StatusInternalServerError)
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
	w.Write([]byte(`{"result": "login successffully"}`))
}

// logout
func (c *Controller) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok || userID == 0 {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:  "session_id",
		Value: "",
		Path:  "/",
	})

	err := c.DB.DisconnectUser(userID)
	if err != nil {
		http.Error(w, "DB ERROR", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"result": "Logged out successfully"}`))
}
