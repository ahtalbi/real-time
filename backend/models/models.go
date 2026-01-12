package models

import (
	"database/sql"
	"time"
)

type UserInfos struct {
	LoggedIn   bool
	User       string
	Posts      []Post
	Categories []string
}

// user
type User struct {
	ID        int
	Nickname  string
	Birthday  time.Time
	Gender    string
	Firstname string
	Lastname  string
	Email     string
	Password  string
	SessionID sql.NullString
}

// posts
type Post struct {
	ID            int
	UserID        int
	Content       string
	CategoryType  []string
	CreatedAt     time.Time
	NbrOfLikes    int
	NbrOfDislikes int
	Comments      []Comment
}

// comments
type Comment struct {
	ID        int
	Content   string
	UserID    int
	PostID    int
	CreatedAt time.Time
}

// messages
type Message struct {
	ID         int
	SenderID   int
	ReceiverID int
	Content    string
	CreatedAt  time.Time
}

// include (psot or comment ID), (PostOrComment: "POST" or "COMMENT"), (type : 0 = dislike, 1 = like) ...etc
type Reaction struct {
	PostorcommentID int    `json:"id"`
	PostOrComment   string `json:"postOrComment"`
	Type            int    `json:"type"`
	UserID          int
	CreatedAt       time.Time
}
