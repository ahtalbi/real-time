package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"rtf/models"
	"rtf/pkg"
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
	c.Anounce()
}

func (c *Controller) Anounce() {
	c.Ws.Mu.Lock()
	if len(c.Ws.Clients) == 0 {
		c.Ws.Mu.Unlock()
		return
	}

	clients := make([]*UserWS, 0, len(c.Ws.Clients))
	for _, client := range c.Ws.Clients {
		clients = append(clients, client)
	}
	c.Ws.Mu.Unlock()

	for _, client := range clients {
		usersinfo, er := c.DB.GetUsersInfoFor(client.UserInfo.ID, true)
		if er != nil {
			continue
		}
		usersinfo = pkg.SortUsers(usersinfo)

		c.Ws.Mu.Lock()
		for i, u := range usersinfo {
			if _, ok := c.Ws.Clients[u.ID]; ok {
				usersinfo[i].IsOnline = true
			} else {
				usersinfo[i].IsOnline = false
			}
		}

		if client != nil && client.Chan != nil {
			select {
			case client.Chan <- map[string]interface{}{
				"type": "ws_users_info_for_user",
				"data": usersinfo,
			}:
			default:
			}
		}
		c.Ws.Mu.Unlock()
	}
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
