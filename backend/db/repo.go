package db

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"time"

	"rtf/models"
	"rtf/pkg"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type Repo struct {
	Db *sql.DB
}

// try to insert the user into the data base, any invalid input will return an error with a specific message
func (r *Repo) InsertUserDB(w http.ResponseWriter, user models.User) error {
	var exist int
	er := r.Db.QueryRow("SELECT 1 FROM users WHERE nickname=? OR email=?", user.Nickname, user.Email).Scan(&exist)
	if er != nil && er != sql.ErrNoRows {
		http.Error(w, "DB error", http.StatusInternalServerError)
		return er
	}

	if exist > 0 {
		http.Error(w, "nickname or e-mail already exist", http.StatusBadRequest)
		return errors.New("user exists")
	}

	iscorrect, er := pkg.AreUserInfoCorret(w, user)
	if er != nil {
		return er
	} else if !iscorrect {
		return errors.New("incorrect infos")
	}

	hashed, er := pkg.HashPassword(user.Password)
	if er != nil {
		http.Error(w, "hash password error", http.StatusInternalServerError)
	}

	if _, err := r.Db.Exec("INSERT INTO users(nickname, birthday, gender, firstname, lastname, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)",
		user.Nickname, user.Birthday, user.Gender, user.Firstname, user.Lastname, user.Email, hashed); err != nil {
		http.Error(w, "failed to insert user", http.StatusInternalServerError)
		return err
	}

	return nil
}

// check existance of the user in the DB
func (r *Repo) IsUserExist(w http.ResponseWriter, user *models.User) (int, error) {
	var userID, hashedPassword string
	err := r.Db.QueryRow("SELECT id, password FROM users WHERE nickname=?", user.Nickname).Scan(&userID, &hashedPassword)
	if err != nil {
		http.Error(w, "DB error", http.StatusInternalServerError)
		return -1, err
	}

	if bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(user.Password)) != nil {
		http.Error(w, "password incorrect", http.StatusBadRequest)
		return -1, errors.New("password incorrect")
	}

	id, err := strconv.Atoi(userID)
	if err != nil {
		http.Error(w, "atoi error", http.StatusInternalServerError)
		return -1, err
	}
	return id, nil
}

// set new session in case of user login
func (r *Repo) SetUserSession(w http.ResponseWriter, userID int) ([]interface{}, error) {
	sessionId := uuid.NewString()
	now := time.Now()
	expired := now.Add(24 * time.Hour)

	_, err := r.Db.Exec("UPDATE users SET session_id=?, session_created_at=?, session_expired_at=? WHERE id=?", sessionId, now, expired, userID)
	if err != nil {
		return nil, err
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sessionId,
		Path:     "/",
		HttpOnly: true,
		Expires:  expired,
	})
	i := []interface{}{sessionId, expired}
	return i, nil
}

// delete the session from the DB in case of logout
func (r *Repo) DisconnectUser(userID int) error {
	_, er := r.Db.Exec("UPDATE users SET session_id=NULL, session_created_at=NULL, session_expired_at=NULL WHERE id=?", userID)
	return er
}

// this check session sended by the browser if it is included in the DB
func (r *Repo) CheckSessionExistance(req *http.Request) (int, error) {
	cookie, er := req.Cookie("session_id")
	if er != nil || cookie.Value == "" {
		return 0, er
	}
	return 0, nil
}
