package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func main() {
	public := "."

	fs := http.FileServer(http.Dir(public))
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		reqPath := filepath.Clean(r.URL.Path)         
		fullPath := filepath.Join(public, reqPath)
		ext := filepath.Ext(reqPath)

		if ext != "" {
			info, err := os.Stat(fullPath)
			if err == nil && !info.IsDir() {
				fs.ServeHTTP(w, r)
				return
			}
			http.NotFound(w, r)
			return
		}
		http.ServeFile(w, r, filepath.Join(public, "index.html"))
	})

	ser := http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	fmt.Println("http://localhost:8080")
	log.Fatal(ser.ListenAndServe())
}
