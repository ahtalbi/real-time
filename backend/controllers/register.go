package controllers

import (
	"fmt"
	"io"
	"net/http"
)

func (c *Controller) Register(w http.ResponseWriter, r *http.Request) {
	body, _ := io.ReadAll(r.Body)
	fmt.Printf(string(body))
}
