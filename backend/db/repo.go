package db

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"rtf/config"
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

	//
	_, err = r.Db.Exec(
		"INSERT INTO users(id, nickname, birthday, gender, firstname, lastname, email, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		user.ID, user.Nickname, user.Birthday, user.Gender, user.Firstname, user.Lastname, user.Email, hashed,
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

	if len(user.Email) > 60 || len(user.Nickname) > 60 || len(user.Password) > 60 {
		return "", errors.New("user not exist")
	}

	err := r.Db.QueryRow("SELECT id, password FROM users WHERE nickname=? OR email=?", user.Nickname, user.Nickname).Scan(&id, &hashedPassword)
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
	if err != nil || cookie == nil || cookie.Value == "" {
		fmt.Println("here")
		return user, fmt.Errorf("Error-session")
	}

	// check in DB
	err = r.Db.QueryRow("SELECT id, nickname, birthday, gender, firstname, lastname, email, session_expired_at FROM users WHERE session_id = ?", cookie.Value).
		Scan(&user.ID, &user.Nickname, &user.Birthday, &user.Gender, &user.Firstname, &user.Lastname, &user.Email, &user.SessionExpired)
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

func (r *Repo) InsertPostDB(userID string, post models.Post, categoryIDs []int) (models.Post, error) {
	id := uuid.NewString()
	t := time.Now().Format("2006-01-02 15:04:05.000000")

	IDS := ""
	for _, categoryID := range categoryIDs {
		IDS += strconv.Itoa(categoryID) + ","
	}

	if len(IDS) > 0 {
		IDS = IDS[:len(IDS)-1]
	}

	_, err := r.Db.Exec(
		`INSERT INTO posts(id, user_id, category_ids, content, url_image, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
		id, userID, IDS, post.Content, post.ImageURL, t,
	)
	if err != nil {
		return post, errors.New("SERVER ERROR")
	}

	post.ID = id
	post.CreatedAt = t
	return post, nil
}

// this check if the categories exists in DB,  it return the categories id & bool, bool type is false in case of an element not exist, true otherwise
func (r *Repo) IsCategoryCorrect(category string) ([]int, error) {
	if len(category) == 0 {
		return nil, errors.New("post category is required")
	}

	categories := strings.Split(category, ",")
	seen := make(map[string]bool)
	var ids []int

	for _, c := range categories {
		c = strings.TrimSpace(c)

		if seen[c] {
			return nil, errors.New("duplicate category")
		}
		seen[c] = true

		var id int
		err := r.Db.QueryRow(
			"SELECT id FROM categories WHERE category_name = ?",
			c,
		).Scan(&id)
		if err != nil {
			return nil, errors.New("invalid category")
		}

		ids = append(ids, id)
	}
	if len(ids) == 0 {
		return nil, errors.New("invalid category")
	}

	return ids, nil
}

// insert comment into the DB
func (r *Repo) InsertCommentDB(comment models.Comment) (models.Comment, error) {
	id := uuid.NewString()
	t := time.Now().Format("2006-01-02 15:04:05.000000")
	_, er := r.Db.Exec(
		"INSERT INTO comments (id, content, user_id, post_id, created_at) VALUES (?, ?, ?, ?, ?)", id, comment.Content, comment.UserID, comment.PostID, t,
	)
	comment.CreatedAt = t
	comment.NbrOfReactions = 0
	comment.UserReaction = -1
	comment.ID = id

	if er != nil {
		return models.Comment{}, errors.New("SERVER ERROR")
	}

	// get the user nickname
	comment.AutherName, er = r.GetUserAuthernameByID(comment.UserID)
	if er != nil {
		return models.Comment{}, errors.New("SERVER ERROR")
	}

	return comment, nil
}

// to insert a comment to the DB need to check if this post already exist in the DB
func (r *Repo) PostExists(postID string) error {
	var id string
	err := r.Db.QueryRow("SELECT id FROM posts WHERE id = ?", postID).Scan(&id)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("post not exist")
		}
		return errors.New("SERVER ERROR")
	}
	return nil
}

// to insert a reaction (like/dislike) to the DB need to check if comment is EXIST in the DB, any error found will be returned
func (r *Repo) CommentExists(commentID string) error {
	var id int
	err := r.Db.QueryRow("SELECT 1 FROM comments WHERE id = ?", commentID).Scan(&id)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("comment not exist")
		}
		return errors.New("SERVER ERROR")
	}
	return nil
}

// insert a reaction to the post in the DB
func (r *Repo) InsertPostReaction(userID string, reaction models.Reaction) error {
	if reaction.Type < 0 || reaction.Type > 6 {
		return errors.New("invalid reaction type")
	}

	t := time.Now().Format("2006-01-02 15:04:05")

	var c int
	er := r.Db.QueryRow(`SELECT reaction_type FROM post_reactions WHERE user_id = ? AND post_id = ?`, userID, reaction.PostorcommentID).Scan(&c)

	// if no reaction exists
	if er == sql.ErrNoRows {
		_, er = r.Db.Exec(`INSERT INTO post_reactions (reaction_type, user_id, post_id, created_at) VALUES (?, ?, ?, ?)`, reaction.Type, userID, reaction.PostorcommentID, t)
		return er
	}

	if er != nil {
		return errors.New("SERVER ERROR")
	}

	if c == reaction.Type {
		// if the same reaction exist in the DB
		_, er = r.Db.Exec(`DELETE FROM post_reactions WHERE user_id = ? AND post_id = ?`, userID, reaction.PostorcommentID)
		return er
	}

	// if another exists
	_, er = r.Db.Exec(`UPDATE post_reactions SET reaction_type = ?, created_at = ? WHERE user_id = ? AND post_id = ?`, reaction.Type, t, userID, reaction.PostorcommentID)
	return er
}

// insert a reaction into comment in the DB
func (r *Repo) InsertCommentReaction(userID string, reaction models.Reaction) error {
	if reaction.Type < 0 || reaction.Type > 6 {
		return errors.New("invalid reaction type")
	}

	t := time.Now().Format("2006-01-02 15:04:05")

	var c int
	er := r.Db.QueryRow(`SELECT reaction_type FROM comment_reactions WHERE user_id = ? AND comment_id = ?`, userID, reaction.PostorcommentID).Scan(&c)

	if er == sql.ErrNoRows {
		_, er = r.Db.Exec(`INSERT INTO comment_reactions (reaction_type, user_id, comment_id, created_at) VALUES (?, ?, ?, ?)`, reaction.Type, userID, reaction.PostorcommentID, t)
		return er
	}

	if er != nil {
		return errors.New("SERVER ERROR")
	}

	if c == reaction.Type {
		_, er = r.Db.Exec(`DELETE FROM comment_reactions WHERE user_id = ? AND comment_id = ?`, userID, reaction.PostorcommentID)
		return er
	}
	_, er = r.Db.Exec(`UPDATE comment_reactions SET reaction_type = ?, created_at = ? WHERE user_id = ? AND comment_id = ?`, reaction.Type, t, userID, reaction.PostorcommentID)
	return er
}

// this function get 10 posts from DB with its comments, reactions and categories starting from 'endID'
func (r *Repo) Get10PostsfromDB(userID string, offset int) ([]models.Post, error) {
	posts := []models.Post{}

	rows, er := r.Db.Query(`SELECT id, user_id, content, url_image, created_at FROM posts ORDER BY created_at DESC LIMIT 10 OFFSET ?`, offset)
	if er != nil {
		if er == sql.ErrNoRows {
			return nil, errors.New("no post exist yet")
		}
		return nil, errors.New("SERVER ERROR")
	}
	defer rows.Close()

	for rows.Next() {
		var p models.Post

		er := rows.Scan(&p.ID, &p.UserID, &p.Content, &p.ImageURL, &p.CreatedAt)
		if er != nil {
			return nil, er
		}
		// get the number of comments
		err := r.Db.QueryRow(`SELECT COUNT(*) FROM comments WHERE post_id = ?`, p.ID).Scan(&p.NbrOfComments)
		if err != nil {
			return nil, err
		}

		// get the user nickname
		p.AutherName, er = r.GetUserAuthernameByID(p.UserID)
		if er != nil {
			return nil, errors.New("SERVER ERROR")
		}
		// get comments from DB
		p.Comments, p.NbrOfComments, er = r.Get10PostComments(p.ID, 0)

		if er != nil {
			return nil, er
		}
		// get categories from DB
		p.CategoryType, er = r.GetPostCategory(p.ID)
		if er != nil {
			return nil, er
		}

		// get the number of likes/dislikes
		p.NbrOfLikes, p.NbrOfDislikes, er = r.getPostReactions(p.ID)
		if er != nil {
			return nil, er
		}
		p.NbrOfReactions, er = r.CountPostReactions(p.ID)
		if er != nil {
			return nil, er
		}
		p.UserReaction, er = r.GetUserPostReaction(userID, p.ID)
		if er != nil {
			return nil, er
		}
		posts = append(posts, p)
	}
	return posts, nil
}

func (r *Repo) GetUserAuthernameByID(userID string) (string, error) {
	var nickname string
	er := r.Db.QueryRow("SELECT nickname FROM users WHERE id=?", userID).Scan(&nickname)
	return nickname, er
}

// this function get the comments post from DB based on an postID
func (r *Repo) Get10PostComments(postid string, offset int) ([]models.Comment, int, error) {
	res := []models.Comment{}

	var t int
	er := r.Db.QueryRow(`SELECT COUNT(*) FROM comments WHERE post_id = ?`, postid).Scan(&t)
	if er != nil {
		return nil, 0, er
	}

	rows, er := r.Db.Query(` SELECT id, user_id, content, created_at FROM comments WHERE post_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`, postid, config.COMMENTS_FETCH_LIMIT, offset)
	if er != nil {
		if er == sql.ErrNoRows {
			return nil, 0, errors.New("not exists")
		}
		return nil, 0, errors.New("SERVER ERROR")
	}
	defer rows.Close()

	for rows.Next() {
		var c models.Comment
		er := rows.Scan(&c.ID, &c.UserID, &c.Content, &c.CreatedAt)
		if er != nil {
			return nil, 0, er
		}
		c.AutherName, er = r.GetUserAuthernameByID(c.UserID)
		if er != nil {
			return nil, 0, errors.New("SERVER ERROR")
		}
		c.NbrOfReactions, er = r.CountCommentReactions(c.ID)
		if er != nil {
			return nil, 0, errors.New("SERVER ERROR")
		}
		c.UserReaction, er = r.GetUserCommentReaction(c.UserID, c.ID)
		if er != nil {
			return nil, 0, errors.New("SERVER ERROR")
		}
		res = append(res, c)
	}
	return res, t, nil
}

// this func get the categories related to the post from DB
func (r *Repo) GetPostCategory(postID string) (string, error) {
	var categoryIDs string

	// get "1,2,3"
	err := r.Db.QueryRow(`SELECT category_ids FROM posts WHERE id = ?`, postID).Scan(&categoryIDs)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", errors.New("post not exists")
		}
		return "", errors.New("SERVER ERROR")
	}

	ids := strings.Split(categoryIDs, ",")
	categories := []string{}

	// get categories name
	for _, id := range ids {
		id = strings.TrimSpace(id)
		var name string
		err := r.Db.QueryRow(`SELECT category_name FROM categories WHERE id = ?`, id).Scan(&name)
		if err != nil {
			return "", errors.New("invalid category")
		}
		categories = append(categories, name)
	}

	res := strings.Join(categories, ",")

	return res, nil
}

// get the reaction (likes/dislikes) from DB
func (r *Repo) getPostReactions(postID string) (int, int, error) {
	var likes, dislikes int

	err := r.Db.QueryRow(`SELECT COUNT(*) FROM post_reactions WHERE reaction_type = 0 AND post_id = ?`, postID).Scan(&dislikes)
	if err != nil {
		return 0, 0, err
	}
	err = r.Db.QueryRow(`SELECT COUNT(*) FROM post_reactions WHERE reaction_type = 1 AND post_id = ?`, postID).Scan(&likes)
	if err != nil {
		return 0, 0, err
	}
	return likes, dislikes, nil
}

func (r *Repo) CountPostReactions(postID string) (int, error) {
	var total int
	err := r.Db.QueryRow(`SELECT COUNT(*) FROM post_reactions WHERE post_id = ?`, postID).Scan(&total)
	if err != nil {
		return 0, errors.New("SERVER ERROR")
	}
	return total, nil
}

func (r *Repo) CountCommentReactions(commentID string) (int, error) {
	var total int
	err := r.Db.QueryRow(`SELECT COUNT(*) FROM comment_reactions WHERE comment_id = ?`, commentID).Scan(&total)
	if err != nil {
		return 0, errors.New("SERVER ERROR")
	}
	return total, nil
}

func (r *Repo) GetUserPostReaction(userID string, postID string) (int, error) {
	var reaction int
	err := r.Db.QueryRow(`SELECT reaction_type FROM post_reactions WHERE user_id = ? AND post_id = ?`, userID, postID).Scan(&reaction)
	if err != nil {
		if err == sql.ErrNoRows {
			return -1, nil
		}
		return -1, errors.New("SERVER ERROR")
	}
	return reaction, nil
}

func (r *Repo) GetUserCommentReaction(userID string, commentID string) (int, error) {
	var reaction int
	err := r.Db.QueryRow(`SELECT reaction_type FROM comment_reactions WHERE user_id = ? AND comment_id = ?`, userID, commentID).Scan(&reaction)
	if err != nil {
		if err == sql.ErrNoRows {
			return -1, nil
		}
		return -1, errors.New("SERVER ERROR")
	}
	return reaction, nil
}

// get all users exists in the DB
func (r *Repo) Get100UsersFor(userID string, startID int) ([]models.User, error) {
	var users []models.User

	rows, err := r.Db.Query(`SELECT id, nickname, birthday, gender, firstname, lastname, email FROM users LIMIT 100 OFFSET ?`, startID)
	if err != nil {
		return nil, errors.New("SERVER ERROR")
	}
	defer rows.Close()

	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.ID, &u.Nickname, &u.Birthday, &u.Gender, &u.Firstname, &u.Lastname, &u.Email)
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

// get the users info with the last message for the message list
func (r *Repo) GetUsersInfoFor(userID string, forAll bool) ([]models.UserInfo, error) {
	usersInfo := []models.UserInfo{}

	rows, err := r.Db.Query(`SELECT id, nickname, firstname, lastname FROM users`)
	if err != nil {
		return nil, errors.New("SERVER ERROR")
	}
	defer rows.Close()

	for rows.Next() {
		var u models.UserInfo
		err := rows.Scan(&u.ID, &u.Nickname, &u.Firstname, &u.Lastname)
		if err != nil {
			return nil, errors.New("SERVER ERROR")
		}

		if u.ID == userID && !forAll {
			continue
		}
		// get the last message between them
		var msg models.Message
		err = r.Db.QueryRow(`
            SELECT id, sender_id, receiver_id, content, is_NOT_read, created_at 
            FROM messages 
            WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at DESC 
            LIMIT 1
        `, userID, u.ID, u.ID, userID).Scan(&msg.ID, &msg.SenderID, &msg.ReceiverID, &msg.Content, &msg.IsNotRead, &msg.CreatedAt)

		if err != nil && err != sql.ErrNoRows {
			return nil, errors.New("SERVER ERROR")
		}
		u.LastMessage = msg

		// calcul the number of messages not read from the other user
		var count int
		err = r.Db.QueryRow(` SELECT COUNT(*) FROM messages WHERE sender_id = ? AND receiver_id = ? AND is_NOT_read = 1`, u.ID, userID).Scan(&count)
		if err != nil {
			return nil, errors.New("SERVER ERROR")
		}
		u.NumberOfUnreadMessages = count

		usersInfo = append(usersInfo, u)

	}

	if len(usersInfo) == 0 {
		return nil, errors.New("no user exists")
	}

	return usersInfo, nil
}

// get the user id based on the front id from DB
func (r *Repo) GetUserByFrontID(frontID string) (string, error) {
	var id string
	er := r.Db.QueryRow("SELECT id FROM users WHERE front_id=?", frontID).Scan(&id)
	return id, er
}

// insert new message to the DB
func (r *Repo) InsertMessage(msg map[string]interface{}) (models.Message, error) {
	content, ok1 := msg["Content"].(string)
	senderID, ok2 := msg["SenderID"].(string)
	receiverID, ok3 := msg["ReceiverID"].(string)
	if !ok1 || !ok2 || !ok3 {
		return models.Message{}, errors.New("invalid message format")
	}

	m := models.Message{
		SenderID:   senderID,
		ReceiverID: receiverID,
		Content:    content,
		CreatedAt:  time.Now().Format("2006-01-02 15:04:05.000000"),
	}

	res, er := r.Db.Exec("INSERT INTO messages(sender_id, receiver_id, content, is_NOT_read, created_at) VALUES (?, ?, ?, ?, ?)", m.SenderID, m.ReceiverID, m.Content, 1, m.CreatedAt)
	if er != nil {
		return models.Message{}, er
	}

	id, _ := res.LastInsertId()
	m.ID = int(id)
	m.IsNotRead = 1

	m.SenderName, er = r.GetUserAuthernameByID(senderID)
	if er != nil {
		return models.Message{}, er
	}
	m.ReceiverName, er = r.GetUserAuthernameByID(receiverID)
	if er != nil {
		return models.Message{}, er
	}

	return m, nil
}

func (r *Repo) SetMessageRead(senderID, receiverID string) error {
	_, er := r.Db.Exec(` UPDATE messages SET is_NOT_read = 0 WHERE sender_id = ? AND receiver_id = ? AND is_NOT_read = 1`, senderID, receiverID)
	if er != nil {
		return er
	}
	return nil
}

// get user infos from DB
func (r *Repo) GetUserInfos(userID string) (models.User, error) {
	var user models.User

	err := r.Db.QueryRow(`SELECT id, nickname, birthday, gender, firstname, lastname, email 
		FROM users WHERE id=?`, userID).
		Scan(&user.ID, &user.Nickname, &user.Birthday, &user.Gender, &user.Firstname, &user.Lastname, &user.Email)
	if err != nil {
		return user, err
	}
	return user, nil
}

// this method get the users with its last message in order from DB for chat
func (r *Repo) GetUsersForChatInOrder(userID string, offset int) ([]models.Message, error) {
	rows, er := r.Db.Query(`
		SELECT sender_id, receiver_id, content, is_NOT_read, created_at FROM messages
		WHERE sender_id = ? OR receiver_id = ?
		ORDER BY created_at DESC`, userID, userID)
	if er != nil {
		return nil, er
	}
	defer rows.Close()

	msgs := []models.Message{}
	seen := make(map[string]bool)
	i := 0

	for rows.Next() {
		m := models.Message{}
		if er := rows.Scan(&m.SenderID, &m.ReceiverID, &m.Content, &m.IsNotRead, &m.CreatedAt); er != nil {
			continue
		}

		if m.SenderID != userID {
			// in case the user is the receiver
			if seen[m.SenderID] {
				continue
			}
			seen[m.SenderID] = true

			if i < offset {
				i++
				continue
			}

			if er := r.GetUserNickNameByID(&m.SenderNickname, m.SenderID); er != nil {
				return nil, errors.New("SERVER ERROR")
			}

		} else {
			// in case the user is the sender
			if seen[m.ReceiverID] {
				continue
			}
			seen[m.ReceiverID] = true

			if i < offset {
				i++
				continue
			}

			if er := r.GetUserNickNameByID(&m.ReceiverNickname, m.ReceiverID); er != nil {
				return nil, errors.New("SERVER ERROR")
			}
		}

		msgs = append(msgs, m)
		if len(msgs) >= 100 {
			break
		}
	}

	return msgs, nil
}

// get the user nickname by its ID from DB
func (r *Repo) GetUserNickNameByID(nickname *string, userID string) error {
	return r.Db.QueryRow("SELECT nickname FROM users WHERE id=?", userID).Scan(nickname)
}

// this method get the messages history between two users from DB in order from the offset provided at ascending order
func (r *Repo) GetMessagesHistoryBetweenTwoUsers(senderID, receiverID string, offset int) ([]models.Message, error) {
	rows, er := r.Db.Query(`
        SELECT sender_id, receiver_id, content, created_at 
        FROM messages
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at DESC
        LIMIT 10 OFFSET ?`,
		senderID, receiverID, receiverID, senderID, offset)
	if er != nil {
		return nil, er
	}
	defer rows.Close()

	msgs := []models.Message{}
	for rows.Next() {
		m := models.Message{}
		er := rows.Scan(&m.SenderID, &m.ReceiverID, &m.Content, &m.CreatedAt)
		if er != nil {
			continue
		}
		m.ReceiverName, er = r.GetUserAuthernameByID(m.ReceiverID)
		if er != nil {
			continue
		}
		m.SenderName, er = r.GetUserAuthernameByID(m.SenderID)
		if er != nil {
			continue
		}
		msgs = append(msgs, m)
	}
	return msgs, nil
}
