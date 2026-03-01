package routes

import (
	"context"
	"net/http"
)

// return StatusUnauthorized if the user not loggedin
func (h *Handler) Middleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// check session existance
		user, err := h.Repo.CheckSessionExistance(r)
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error":"unauthorized"}`))
			return
		}
		if len(user.ID) == 0 {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error":"unauthorized"}`))
			return
		}
		ctx := context.WithValue(r.Context(), "userID", user.ID)
		next(w, r.WithContext(ctx))
	}
}
