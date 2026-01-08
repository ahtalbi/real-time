package routes

import (
	"net/http"
)

func Routes(mux *http.ServeMux, handler *Handler) {
	routes := map[string]http.HandlerFunc{
		"/":         handler.Cntrlrs.Home,
		"/register": handler.Cntrlrs.Register,
		"/login":    handler.Cntrlrs.Login,
		"/logout":   handler.Cntrlrs.Logout,
	}

	for path, h := range routes {
		mux.HandleFunc(path, handler.Middleware(h))
	}
}
