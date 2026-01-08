package routes

import (
	"context"
	"net/http"
)

func (h *Handler) Middleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// check rate limit

		// check session existance
		userID, er := h.Repo.CheckSessionExistance(r)
		if er != nil {
			return
		}

		ctx := context.WithValue(r.Context(), "userID", userID)
		next(w, r.WithContext(ctx))
	}
}
