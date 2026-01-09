package db

import (
	"database/sql"
	"errors"
	"net/http"
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
func (r *Repo) InsertUserDB(user models.User) error {
	// check the user existance in DB
	var exist int
	err := r.Db.QueryRow("SELECT 1 FROM users WHERE nickname=? OR email=?", user.Nickname, user.Email).Scan(&exist)
	if err != nil && err != sql.ErrNoRows {
		return err
	}
	if exist > 0 {
		return errors.New("USER ALREADY EXIST")
	}

	// check the user infos if correct
	isCorrect, err := pkg.AreUserInfosCorret(user)
	if err != nil {
		return err
	} else if !isCorrect {
		return errors.New("INCORRECT INFOS")
	}

	//
	hashed, err := pkg.HashPassword(user.Password)
	if err != nil {
		return err
	}

	//
	_, err = r.Db.Exec(
		"INSERT INTO users(nickname, birthday, gender, firstname, lastname, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)",
		user.Nickname, user.Birthday, user.Gender, user.Firstname, user.Lastname, user.Email, hashed,
	)
	if err != nil {
		return err
	}

	return nil
}

// check existance of the user in the DB
func (r *Repo) IsUserExist(user *models.User) (int, error) {
	var id int
	var hashedPassword string

	err := r.Db.QueryRow("SELECT id, password FROM users WHERE nickname=?", user.Nickname).Scan(&id, &hashedPassword)

	if err == sql.ErrNoRows {
		return -1, errors.New("USER NOT EXIST")
	}

	if bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(user.Password)) != nil {
		return -1, errors.New("PASSWORD INCORRECT")
	}

	if err != nil {
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
	return []interface{}{sessionId, expired}, nil
}

// delete the session from the DB in case of logout
func (r *Repo) DisconnectUser(userID int) error {
	_, er := r.Db.Exec("UPDATE users SET session_id=NULL, session_created_at=NULL, session_expired_at=NULL WHERE id=?", userID)
	return er
}

// this check session sended by the browser if it is included in the DB
func (r *Repo) CheckSessionExistance(req *http.Request) (int, error) {
	// check in the browser
	cookie, err := req.Cookie("session_id")
	if err != nil || cookie.Value == "" {
		return 0, err
	}

	// check in DB
	var userID int
	err = r.Db.QueryRow("SELECT id FROM users WHERE session_id = ?", cookie.Value).Scan(&userID)
	if err != nil {
		return 0, err
	}

	return userID, nil
}

func (r *Repo) InsertPostDB(userID int, post models.Post, ids []int) error {
	// Insert post
	res, err := r.Db.Exec("INSERT INTO posts(user_id, content, created_at) VALUES (?, ?, ?)", userID, post.Content, time.Now())
	if err != nil {
		return err
	}
	// get the last inserted id
	postID, err := res.LastInsertId()
	if err != nil {
		return err
	}
	// Insert categories (many to many)
	for _, catID := range ids {
		_, err := r.Db.Exec("INSERT INTO posts_categories(post_id, category_id) VALUES (?, ?)", postID, catID)
		if err != nil {
			return err
		}
	}
	return nil
}

// this check if the categories exists in DB,  it return the categories id & bool, bool type is false in case of an element not exist, true otherwise
func (r *Repo) AreCategoriesCorrect(categories []string) ([]int, error) {
	ids := []int{}
	for _, cat := range categories {
		var id int
		err := r.Db.QueryRow("SELECT id FROM categories WHERE category_name = ?", cat).Scan(&id)
		if err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}
