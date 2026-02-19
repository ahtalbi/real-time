package pkg

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"time"

	"rtf/config"
	"rtf/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// sort the users that we have a conversation with by the last message date and the rest of the users by their nickname
func SortUsers(usersinfo []models.UserInfo) []models.UserInfo {
	res := []models.UserInfo{}

	conv := []models.UserInfo{}
	vide := []models.UserInfo{}

	for _, i := range usersinfo {
		if i.LastMessage.ID >= 1 {
			conv = append(conv, i)
		} else {
			vide = append(vide, i)
		}
	}

	sort.Slice(conv, func(i, j int) bool {
		t1, _ := time.Parse("2006-01-02 15:04:05", conv[i].LastMessage.CreatedAt)
		t2, _ := time.Parse("2006-01-02 15:04:05", conv[j].LastMessage.CreatedAt)
		return t1.After(t2)
	})

	sort.Slice(vide, func(i, j int) bool {
		return vide[i].Nickname < vide[j].Nickname
	})

	res = append(res, conv...)
	res = append(res, vide...)
	return res
}

// this funcion check if the informations mutch the expected , any error found will be returned
func AreUserInfosCorret(user models.User) error {
	// empty feild
	if len(user.Nickname) == 0 ||
		len(user.Birthday) == 0 ||
		len(user.Gender) == 0 ||
		len(user.Firstname) == 0 ||
		len(user.Lastname) == 0 ||
		len(user.Email) == 0 ||
		len(user.Password) == 0 {
		return errors.New("all feilds are required")
	}

	// if user too young
	b, err := time.Parse("2006-01-02", user.Birthday)
	if err != nil {
		return errors.New("invalid date format")
	}
	now := time.Now().Unix()
	max := now - int64(60*60*24*365.25*200)
	legal := now - int64(60*60*24*365.25*15)
	birth_ms := b.Unix()

	if birth_ms > legal || birth_ms < max {
		return errors.New("you're not allowed to use this website")
	}

	// gender
	if user.Gender != "Male" &&
		user.Gender != "Female" &&
		user.Gender != "Other" {
		return errors.New("invalid gender")
	}

	// check the format of the firstname/lastname/nickname
	if !regexp.MustCompile(`^[a-zA-Z0-9_]+$`).MatchString(user.Nickname) {
		return errors.New("invalid nickname format")
	}
	if !regexp.MustCompile(`^[a-zA-Z_]+$`).MatchString(user.Firstname) {
		return errors.New("invalid firstname format")
	}
	if !regexp.MustCompile(`^[a-zA-Z_]+$`).MatchString(user.Lastname) {
		return errors.New("invalid lastname format")
	}

	// email format
	if !regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`).MatchString(user.Email) {
		return errors.New("invalid email format")
	}

	// more than max length
	if len(user.Nickname) > 30 || len(user.Firstname) > 30 || len(user.Lastname) > 30 ||
		len(user.Email) > 60 || len(user.Password) > 60 {
		return errors.New("feild too large")
	}

	return nil
}

// this function try hash the password with bcrypt , any error found will be returned
func HashPassword(password string) (string, error) {
	hashed, er := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if er != nil {
		return "", errors.New("SERVER ERROR")
	}
	return string(hashed), nil
}

// check if the post content is valid
func ArePostInfosCorrect(post models.Post) error {
	if len(post.Content) == 0 || len(post.CategoryType) == 0 {
		return errors.New("all feilds are required")
	}
	if len(post.Content) > 500 {
		errors.New("post too large")
	}
	return nil
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

// check if the message format is correct
func TheMessageFormatIsCorrect(data map[string]interface{}) bool {
	content, ok := data["Content"].(string)
	if !ok {
		return false
	}
	receiverID, ok := data["ReceiverID"].(string)
	if !ok {
		return false
	}
	return len(content) > 0 && len(content) < 500 && len(receiverID) > 0 && len(receiverID) < 100
}

// this is a helper function return HTTP errors
func StatusError(w http.ResponseWriter, er error) {
	if er != nil {
		if er.Error() == "SERVER ERROR" {
			w.WriteHeader(http.StatusInternalServerError)
		} else {
			w.WriteHeader(http.StatusBadRequest)
		}
		w.Write([]byte(fmt.Sprintf(`{"error": "%s"}`, er)))
		return
	}
}

// this function save a file in the pics folder and return its new name that was generated randomly
func SaveFile(r io.Reader, originalName string) string {
	name := uuid.New().String() + filepath.Ext(originalName)
	fp := "db/pics/" + name

	out, err := os.Create(fp)
	if err != nil {
		return ""
	}
	defer out.Close()

	_, err = io.Copy(out, r)
	if err != nil {
		return ""
	}

	return name
}
