package controllers

import (
	"encoding/json"
	"net/http"
	"time"

	"rtf/models"
)

// register
func (c *Controller) Register(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		w.Write([]byte(`{"error":"method not allowed"}`))
		return
	}

	var user models.User
	defer r.Body.Close()

	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"invalid user infos"}`))
		return
	}

	err = c.DB.InsertUserDB(user)
	if err != nil {
		switch err.Error() {
		case "USER ALREADY EXIST":
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error":"USER ALREADY EXIST"}`))
			break
		case "INCORRECT INFOS":
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error":"INCORRECT INFOS"}`))
			break
		default:
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"DB ERROR"}`))
		}
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"result": "registered successfully"}`))
}

// login handler
func (c *Controller) Login(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		w.Write([]byte(`{"error":"method not allowed"}`))
		return
	}

	var user models.User
	defer r.Body.Close()

	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"invalid user infos"}`))
		return
	}

	userID, er := c.DB.IsUserExist(&user)
	if er != nil {
		switch er.Error() {
		case "USER NOT EXIST", "PASSWORD INCORRECT":
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error":"user not exists or incorrect password"}`))
			break
		default:
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"DB ERROR"}`))
		}
		return
	}

	a, er := c.DB.SetUserSession(w, userID)
	if er != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"DB ERROR"}`))
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    a[0].(string),
		Path:     "/",
		HttpOnly: true,
		Expires:  a[1].(time.Time),
	})

	// will send the list of the freinds temporary ----- will be deleted later
	users, er := c.DB.GetAllUsers()
	if er != nil {
		return
	}

	data, er := json.Marshal(map[string]interface{}{
		"result":  "login successfully",
		"friends": users,
	})

	if er != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"marchal ERROR"}`))
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

// logout
func (c *Controller) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
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
