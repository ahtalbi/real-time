package controllers

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// serves static files
func (hand *Controller) StaticsHandler(w http.ResponseWriter, r *http.Request) {
	path := filepath.Join("../frontend", r.URL.Path)
	info, err := os.Stat(path)
	if err != nil || info.IsDir() {
		http.Error(w, "not page not found", http.StatusNotFound)
		return
	}

	http.ServeFile(w, r, path)
}

func (hand *Controller) ServePictures(w http.ResponseWriter, r *http.Request) {
	f := strings.TrimPrefix(r.URL.Path, "/pics/")
	path := filepath.Join("./db/pics", f)
	info, err := os.Stat(path)
	if err != nil || info.IsDir() {
		http.Error(w, "not page not found", http.StatusNotFound)
		return
	}

	http.ServeFile(w, r, path)
}
