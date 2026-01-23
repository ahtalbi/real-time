package routes

import (
	"net/http"
)

func Routes(mux *http.ServeMux, handler *Handler) {
	//
	routes := map[string]http.HandlerFunc{
		"/logout":        handler.Cntrlrs.Logout,
		"/createpost":    handler.Cntrlrs.CreatePost,
		"/createreaction":    handler.Cntrlrs.Reactions,
		"/createcomment": handler.Cntrlrs.CreateComment,
		"/getusers":      handler.Cntrlrs.Getusers,
		"/getposts":      handler.Cntrlrs.GetPosts,
	}
	for path, h := range routes {
		mux.HandleFunc(path, handler.RateLimit(handler.Middleware(h)))
	}

	// home page, login and register routes
	LRroutes := map[string]http.HandlerFunc{
		"/assets/":           handler.Cntrlrs.StaticsHandler,
		"/componenets/":      handler.Cntrlrs.StaticsHandler,
		"/pages/":            handler.Cntrlrs.StaticsHandler,
		"/confing_theme.css": handler.Cntrlrs.StaticsHandler,
		"/src/":              handler.Cntrlrs.StaticsHandler,
		"/packages/":         handler.Cntrlrs.StaticsHandler,

		"/hassession":    handler.Cntrlrs.HasSession,
		"/api/login":    handler.Cntrlrs.Login,
		"/api/register": handler.Cntrlrs.Register,
		"/":             handler.Cntrlrs.Home,
	}
	for path, h := range LRroutes {
		mux.HandleFunc(path, handler.RateLimit(h))
	}

	//
	ws := map[string]http.HandlerFunc{
		"/message": handler.Cntrlrs.Messages,
	}
	for path, h := range ws {
		mux.HandleFunc(path, h)
	}
}
