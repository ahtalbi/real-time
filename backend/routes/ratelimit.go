package routes

import (
	"net/http"
	"time"
)

// this function handle the rate limite of requests based on the user ip
func (h *Handler) RateLimit(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		rl, exist := h.LastRL[ip]

		// set the ip in the ratelimiter map if it not exists yet
		if !exist {
			rl = &RateLimiter{LastTime: time.Now(), Counter: 0}
			h.LastRL[ip] = rl
		}

		// return if too may requests
		if time.Since(rl.LastTime) < 10*time.Second && rl.Counter >= 500 {
			http.Error(w, "Too many requests", http.StatusTooManyRequests)
			return
		}

		// reinitialize the ratelimiter if 20 sec passed
		if time.Since(rl.LastTime) > 20*time.Second {
			rl.Counter = 0
		}

		rl.Counter++
		rl.LastTime = time.Now()

		next(w, r)
	}
}
