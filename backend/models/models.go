package models

import (
	"database/sql"
)

// user
type User struct {
	ID             string
	Nickname       string
	Birthday       string `json:"Birthday"`
	Gender         string
	Firstname      string
	Lastname       string
	Email          string
	Password       string
	SessionID      sql.NullString
	SessionExpired string
}

// posts
type Post struct {
	ID            string
	AutherName    string
	UserID        string
	Content       string
	CategoryType  string
	CreatedAt     string
	NbrOfLikes    int
	NbrOfDislikes int
	NbrOfReactions int
	UserReaction   int
	Comments      []Comment
}

// comments
type Comment struct {
	ID         string
	AutherName string
	Content    string
	UserID     string
	PostID     string
	CreatedAt  string
	NbrOfReactions int
	UserReaction   int
}

// messages
type Message struct {
	ID         string
	SenderID   string
	ReceiverID string
	Content    string
	CreatedAt  string
}

// include (psot or comment ID), (PostOrComment: "POST" or "COMMENT"), (type : 0 -> 6) ...etc
type Reaction struct {
	PostorcommentID string
	PostOrComment   string
	Type            int
	UserID          int
	CreatedAt       string
}
