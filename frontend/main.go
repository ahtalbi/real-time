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
	mux := http.NewServeMux()
	fs := http.FileServer(http.Dir(public))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(public, filepath.Clean(r.URL.Path))

		if info, err := os.Stat(path); err == nil {
			if info.IsDir() && r.URL.Path != "/" {
				http.NotFound(w, r)
				return
			}
			fs.ServeHTTP(w, r)
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
