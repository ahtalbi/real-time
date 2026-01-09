package routes

import (
	"net/http"
)

func Routes(mux *http.ServeMux, handler *Handler) {
	//
	routes := map[string]http.HandlerFunc{
		"/logout": handler.Cntrlrs.Logout,
		"/createpost": handler.Cntrlrs.CreatePost,
	}
	for path, h := range routes {
		mux.HandleFunc(path, handler.RateLimit(handler.Middleware(h)))
	}

	// home page, login and register routes
	LRroutes := map[string]http.HandlerFunc{
		"/":         handler.Cntrlrs.Home,
		"/login":    handler.Cntrlrs.Login,
		"/register": handler.Cntrlrs.Register,
	}
	for path, h := range LRroutes {
		mux.HandleFunc(path, handler.RateLimit(h))
	}
}
