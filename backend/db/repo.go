package db

import (
	"database/sql"
	"errors"
	"fmt"
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
	if len(categories) == 0 {
		return []int{}, nil
	}
	seen := make(map[string]bool)
	ids := []int{}
	for _, cat := range categories {
		// check duplication
		if seen[cat] {
			return nil, errors.New("duplicated category")
		}
		seen[cat] = true

		var id int
		err := r.Db.QueryRow("SELECT id FROM categories WHERE category_name = ?", cat).Scan(&id)
		if err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}

// insert comment into the DB
func (r *Repo) InsertCommentDB(comment models.Comment) error {
	_, err := r.Db.Exec(
		"INSERT INTO comments (content, user_id, post_id, created_at) VALUES (?, ?, ?, ?)", comment.Content, comment.UserID, comment.PostID, time.Now(),
	)
	return err
}

// to insert a comment to the DB need to check if this post already exist in the DB
func (r *Repo) PostExists(postID int) (bool, error) {
	var id int
	err := r.Db.QueryRow("SELECT id FROM posts WHERE id = ?", postID).Scan(&id)
	if err != nil {
		fmt.Println("db error", postID)
		return false, err
	}
	return true, nil
}

// to insert a reaction (like/dislike) to the DB need to check if comment is EXIST in the DB, any error found will be returned
func (r *Repo) CommentExists(commentID int) (bool, error) {
	var id int
	err := r.Db.QueryRow("SELECT 1 FROM comments WHERE id = ?", commentID).Scan(&id)
	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

// insert a reaction to the post in the DB
func (r *Repo) InsertPostReaction(userID int, reaction models.Reaction) error {
	if reaction.Type != 0 && reaction.Type != 1 {
		return errors.New("invalid reaction type")
	}

	_, err := r.Db.Exec("INSERT INTO post_reactions (reaction_type, user_id, post_id, created_at) VALUES (?, ?, ?, ?)",
		reaction.Type, userID, reaction.PostorcommentID, time.Now(),
	)
	return err
}

// insert a reaction into comment in the DB
func (r *Repo) InsertCommentReaction(userID int, reaction models.Reaction) error {
	if reaction.Type != 0 && reaction.Type != 1 {
		return errors.New("invalid reaction type")
	}

	_, err := r.Db.Exec("INSERT INTO comment_reactions (reaction_type, user_id, comment_id, created_at) VALUES (?, ?, ?, ?)",
		reaction.Type, userID, reaction.PostorcommentID, time.Now(),
	)
	return err
}

// this function get 10 posts from DB with its comments, reactions and categories starting from 'endID'
func (r *Repo) GetPosts(endID int) ([]models.Post, error) {
	posts := []models.Post{}

	rows, er := r.Db.Query(`SELECT posts.id, posts.user_id, posts.content, posts.created_at FROM posts
	WHERE posts.id < ? ORDER BY posts.created_at DESC LIMIT 10
	`, endID)
	if er != nil {
		return nil, er
	}
	defer rows.Close()

	for rows.Next() {
		var p models.Post
		er := rows.Scan(&p.ID, &p.UserID, &p.Content, &p.CreatedAt)
		if er != nil {
			return nil, er
		}
		// get comments from DB
		p.Comments, er = r.GetPostComments(p.ID)
		if er != nil {
			return posts, er
		}
		// get categories from DB
		p.CategoryType, er = r.GetPostCategories(p.ID)
		if er != nil {
			return posts, er
		}
		// get the number of likes/dislikes
		p.NbrOfLikes, p.NbrOfDislikes, er = r.getPostReactions(p.ID)
		if er != nil {
			return posts, er
		}
		posts = append(posts, p)
	}
	return posts, nil
}

// this function get the comments post from DB based on an postID
func (r *Repo) GetPostComments(postid int) ([]models.Comment, error) {
	res := []models.Comment{}

	rows, er := r.Db.Query(`SELECT id, content, user_id, post_id, created_at FROM comments WHERE post_id = ?`, postid)
	if er != nil {
		return nil, er
	}
	defer rows.Close()

	for rows.Next() {
		var c models.Comment
		er := rows.Scan(&c.ID, &c.Content, &c.UserID, &c.PostID, &c.CreatedAt)
		if er != nil {
			return nil, er
		}
		res = append(res, c)
	}
	return res, nil
}

// this func get the categories related to the post from DB
func (r *Repo) GetPostCategories(postID int) ([]string, error) {
	categories := []string{}

	rows, er := r.Db.Query(`
	SELECT categories.category_name FROM categories
	JOIN posts_categories ON posts_categories.category_id = categories.id
	WHERE posts_categories.post_id = ?`, postID)
	if er != nil {
		return nil, er
	}
	defer rows.Close()

	for rows.Next() {
		var name string
		er := rows.Scan(&name)
		if er != nil {
			return nil, er
		}
		categories = append(categories, name)
	}
	return categories, nil
}

// get the reaction (likes/disclikes) from DB
func (r *Repo) getPostReactions(postID int) (int, int, error) {
	var likes, dislikes int
	err := r.Db.QueryRow(`SELECT COUNT(*) FROM post_reactions WHERE reaction_type = 1 AND post_id = ?`, postID).Scan(&likes)
	if err != nil {
		return 0, 0, err
	}
	err = r.Db.QueryRow(`SELECT COUNT(*) FROM post_reactions WHERE reaction_type = 0 AND post_id = ?`, postID).Scan(&dislikes)
	if err != nil {
		return 0, 0, err
	}
	return likes, dislikes, nil
}
