package controllers

import (
	"net/http"
	"os"
	"path/filepath"
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
