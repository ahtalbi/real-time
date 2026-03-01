package routes

import (
	"net/http"
)

func Routes(mux *http.ServeMux, handler *Handler) {
	//
	routes := map[string]http.HandlerFunc{
		"/createpost":     handler.Cntrlrs.CreatePost,
		"/createreaction": handler.Cntrlrs.Reactions,
		"/createcomment":  handler.Cntrlrs.CreateComment,
		"/getposts":       handler.Cntrlrs.GetPosts,
		"/getcomments":    handler.Cntrlrs.GetComments,
	}
	for path, h := range routes {
		mux.HandleFunc(path, handler.RateLimit(handler.Middleware(h)))
	}

	// home page, login and register routes
	LRroutes := map[string]http.HandlerFunc{
		"/api/login":    handler.Cntrlrs.Login,
		"/api/register": handler.Cntrlrs.Register,
	}
	for path, h := range LRroutes {
		mux.HandleFunc(path, handler.RateLimit(h))
	}

	//
	ws := map[string]http.HandlerFunc{
		"/ws": handler.Cntrlrs.WebSocket,

		"/assets/":           handler.Cntrlrs.StaticsHandler,
		"/componenets/":      handler.Cntrlrs.StaticsHandler,
		"/pages/":            handler.Cntrlrs.StaticsHandler,
		"/confing_theme.css": handler.Cntrlrs.StaticsHandler,
		"/src/":              handler.Cntrlrs.StaticsHandler,
		"/packages/":         handler.Cntrlrs.StaticsHandler,
		"/pics/":             handler.Cntrlrs.ServePictures,

		"/hassession": handler.Cntrlrs.HasSession,
		"/":           handler.Cntrlrs.Home,
	}
	for path, h := range ws {
		mux.HandleFunc(path, h)
	}
}
