package pkg

import (
	"regexp"
	"time"

	"rtf/config"
	"rtf/models"

	"golang.org/x/crypto/bcrypt"
)

// this funcion check if the informations mutch the expected , any error found will be returned
func AreUserInfosCorret(user models.User) (bool, error) {
	if len(user.Nickname) > 30 || len(user.Firstname) > 30 || len(user.Lastname) > 30 ||
		// user.Gender != "Male" && user.Gender != "Female" && user.Gender != "Other" ||
		len(user.Email) > 60 || len(user.Password) > 60 {
		return false, nil
	}

	if !regexp.MustCompile(`^[a-zA-Z0-9_]+$`).MatchString(user.Nickname) ||
		!regexp.MustCompile(`^[a-zA-Z_]+$`).MatchString(user.Firstname) ||
		!regexp.MustCompile(`^[a-zA-Z_]+$`).MatchString(user.Lastname) ||
		!regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`).MatchString(user.Email) {
		return false, nil
	}

	return true, nil
}

// this function try hash the password with bcrypt , any error found will be returned
func HashPassword(password string) (string, error) {
	hashed, er := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if er != nil {
		return "", er
	}
	return string(hashed), nil
}

// check if the post content is valid
func ArePostInfosCorrect(post models.Post) bool {
	return len(post.CategoryType) != 0 && len(post.Content) != 0 && len(post.Content) < 500
}

// check if the comment data is correct
func IsvalidComment(comment models.Comment) bool {
	return len(comment.Content) != 0 && len(comment.Content) < 500
}

// this function handle the rate limit for the messages
func MessageRLExceeded(count int, last time.Time) bool {
	if time.Since(last) > config.FiveSec {
		return false
	}
	return count >= config.Max_Messages
}
