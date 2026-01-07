package routes

import (
	"net/http"
)

func Routes(mux *http.ServeMux, handler *Handler) {
	routes := map[string]http.HandlerFunc{
		"/": handler.Cntrlrs.Home,
		"/register": handler.Cntrlrs.Register,
	}

	for path, h := range routes {
		mux.HandleFunc(path, Midelware(h))
	}
}
