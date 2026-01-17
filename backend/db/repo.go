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
	// check the user infos if correct
	err := pkg.AreUserInfosCorret(user)
	if err != nil {
		return err
	}

	// check the user existance in DB
	var exist int
	err = r.Db.QueryRow("SELECT 1 FROM users WHERE nickname=? OR email=?", user.Nickname, user.Email).Scan(&exist)
	if err != nil && err != sql.ErrNoRows {
		return errors.New("SERVER ERROR")
	}
	if exist > 0 {
		return errors.New("user alrady exist")
	}

	//
	hashed, err := pkg.HashPassword(user.Password)
	if err != nil {
		return err
	}

	user.ID = uuid.NewString()
	user.FrontID = uuid.NewString()

	//
	_, err = r.Db.Exec(
		"INSERT INTO users(id, front_id, nickname, birthday, gender, firstname, lastname, email, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
		user.ID, user.FrontID, user.Nickname, user.Birthday, user.Gender, user.Firstname, user.Lastname, user.Email, hashed,
	)
	if err != nil {
		return errors.New("SERVER ERROR")
	}

	return nil
}

// check existance of the user in the DB
func (r *Repo) IsUserExist(user *models.User) (string, error) {
	var id string
	var hashedPassword string

	err := r.Db.QueryRow("SELECT id, password FROM users WHERE nickname=? OR email=?", user.Nickname, user.Email).Scan(&id, &hashedPassword)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", errors.New("user not exist")
		}
		return "", errors.New("SERVER ERROR")
	}
	if bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(user.Password)) != nil {
		return "", errors.New("password invalid")
	}

	return id, nil
}

// set new session in case of user login
func (r *Repo) SetUserSession(w http.ResponseWriter, userID string) ([]interface{}, error) {
	sessionId := uuid.NewString()
	now := time.Now()
	timeExpired := now.Add(24 * time.Hour).Format("2006-01-02 15:04:05")
	timeNow := now.Format("2006-01-02 15:04:05")
	e := now.Add(24 * time.Hour)

	_, err := r.Db.Exec("UPDATE users SET session_id=?, session_created_at=?, session_expired_at=? WHERE id=?", sessionId, timeNow, timeExpired, userID)
	if err != nil {
		return nil, errors.New("SERVER ERROR")
	}
	return []interface{}{sessionId, e}, nil
}

// delete the session from the DB in case of logout
func (r *Repo) DisconnectUser(userID string) error {
	_, er := r.Db.Exec("UPDATE users SET session_id=NULL, session_created_at=NULL, session_expired_at=NULL WHERE id=?", userID)
	if er != nil {
		return errors.New("SERVER ERROR")
	}
	return nil
}

// this check session sended by the browser if it is included in the DB
func (r *Repo) CheckSessionExistance(req *http.Request) (models.User, error) {
	var user models.User

	// check in the browser
	cookie, err := req.Cookie("session_id")
	if err != nil || cookie.Value == "" {
		return user, err
	}

	// check in DB
	err = r.Db.QueryRow("SELECT id, front_id, nickname, birthday, gender, firstname, lastname, email, session_expired_at FROM users WHERE session_id = ?", cookie.Value).
		Scan(&user.ID, &user.FrontID, &user.Nickname, &user.Birthday, &user.Gender, &user.Firstname, &user.Lastname, &user.Email, &user.SessionExpired)
	if err != nil {
		return user, err
	}

	// check if the session already expired
	if user.SessionExpired != "" {
		sessionExpiredTime, err := time.Parse("2006-01-02 15:04:05", user.SessionExpired)
		if err != nil {
			return user, err
		}
		if time.Now().After(sessionExpiredTime) {
			return user, errors.New("session expired")
		}
	}

	return user, nil
}

func (r *Repo) InsertPostDB(userID string, post models.Post, ids []int) (models.Post, error) {
	postID := uuid.NewString()
	frontid := uuid.NewString()
	t := time.Now().Format("2006-01-02 15:04:05")

	// Insert post
	_, err := r.Db.Exec("INSERT INTO posts(id, front_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)", postID, frontid, userID, post.Content, t)
	if err != nil {
		return post, errors.New("SERVER ERROR")
	}

	// Insert categories (many to many)
	for _, catID := range ids {
		_, err = r.Db.Exec("INSERT INTO posts_categories(post_id, category_id) VALUES (?, ?)", postID, catID)
		if err != nil {
			return post, errors.New("SERVER ERROR")
		}
	}

	post.FrontID = frontid
	post.CreatedAt = t

	return post, nil
}

// this check if the categories exists in DB,  it return the categories id & bool, bool type is false in case of an element not exist, true otherwise
func (r *Repo) AreCategoriesCorrect(categories []string) ([]int, error) {
	if len(categories) == 0 {
		return []int{}, errors.New("post categorie is required")
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
			return nil, errors.New("SERVER ERROR")
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
func (r *Repo) PostExists(postID string) (bool, error) {
	var id string
	err := r.Db.QueryRow("SELECT id FROM posts WHERE id = ?", postID).Scan(&id)
	if err != nil {
		return false, err
	}
	return true, nil
}

// to insert a reaction (like/dislike) to the DB need to check if comment is EXIST in the DB, any error found will be returned
func (r *Repo) CommentExists(commentID string) (bool, error) {
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
func (r *Repo) InsertPostReaction(userID string, reaction models.Reaction) error {
	if reaction.Type != 0 && reaction.Type != 1 {
		return errors.New("invalid reaction type")
	}

	_, err := r.Db.Exec("INSERT INTO post_reactions (reaction_type, user_id, post_id, created_at) VALUES (?, ?, ?, ?)",
		reaction.Type, userID, reaction.PostorcommentID, time.Now(),
	)
	return err
}

// insert a reaction into comment in the DB
func (r *Repo) InsertCommentReaction(userID string, reaction models.Reaction) error {
	if reaction.Type != 0 && reaction.Type != 1 {
		return errors.New("invalid reaction type")
	}

	_, err := r.Db.Exec("INSERT INTO comment_reactions (reaction_type, user_id, comment_id, created_at) VALUES (?, ?, ?, ?)",
		reaction.Type, userID, reaction.PostorcommentID, time.Now(),
	)
	return err
}

// this function get 10 posts from DB with its comments, reactions and categories starting from 'endID'
func (r *Repo) GetPosts(offset int) ([]models.Post, error) {
	posts := []models.Post{}

	rows, er := r.Db.Query(`SELECT id, front_id, user_id, content, created_at FROM posts ORDER BY created_at DESC LIMIT 10 OFFSET ?`, offset)
	if er != nil {
		return nil, er
	}
	defer rows.Close()

	for rows.Next() {
		var p models.Post
		er := rows.Scan(&p.ID, &p.FrontID, &p.UserID, &p.Content, &p.CreatedAt)
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
		p.ID = ""
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
func (r *Repo) GetPostComments(postid string) ([]models.Comment, error) {
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
func (r *Repo) GetPostCategories(postID string) ([]string, error) {
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
func (r *Repo) getPostReactions(postID string) (int, int, error) {
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

// get all users exists in the DB
func (r *Repo) Get100UsersFor(userID string, startID int) ([]models.User, error) {
	var users []models.User

	rows, err := r.Db.Query(`SELECT id, front_id, nickname, birthday, gender, firstname, lastname, email FROM users LIMIT 100 OFFSET ?`, startID)
	if err != nil {
		return nil, errors.New("SERVER ERROR")
	}
	defer rows.Close()

	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.ID, &u.FrontID, &u.Nickname, &u.Birthday, &u.Gender, &u.Firstname, &u.Lastname, &u.Email)
		if err != nil {
			return nil, errors.New("SERVER ERROR")
		}
		if u.ID != userID {
			users = append(users, u)
		}
	}
	if len(users) == 0 {
		return nil, errors.New("startID reached the max")
	}
	return users, nil
}

// get the user id based on the front id from DB
func (r *Repo) GetUserByFrontID(frontID string) (string, error) {
	var id string
	er := r.Db.QueryRow("SELECT id FROM users WHERE front_id=?", frontID).Scan(&id)
	return id, er
}

// insert new message to the DB
func (r *Repo) InertMessage(from, to, msg string) error {
	_, er := r.Db.Exec("INSERT INTO messages(sender_id, receiver_id, content, created_at) VALUES (?, ?, ?, ?)", from, to, msg, time.Now())
	return er
}

func (r *Repo) GetNicknameByUserID(userID string) (string, error) {
	var name string
	er := r.Db.QueryRow("SELECT nickname FROM users WHERE id=?", userID).Scan(&name)
	if er != nil {
		return "", errors.New("SERVER ERROR")
	}
	return name, nil
}

func (r *Repo) GetUserInfos(userID string) (models.User, error) {
	var user models.User

	err := r.Db.QueryRow(`SELECT front_id, nickname, birthday, gender, firstname, lastname, email 
		FROM users WHERE id=?`, userID).
		Scan(&user.FrontID, &user.Nickname, &user.Birthday, &user.Gender, &user.Firstname, &user.Lastname, &user.Email)
	if err != nil {
		return user, err
	}
	return user, nil
}
