package routes

import (
	"net"
	"net/http"
	"time"
)

// this function handle the rate limite of requests based on the user ip
func (h *Handler) RateLimit(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip, _, _ := net.SplitHostPort(r.RemoteAddr)

		h.Mu.Lock()
		// set the ip in the ratelimiter map if it not exists yet
		rl, exist := h.LastRL[ip]
		if !exist {
			rl = &RateLimiter{LastTime: time.Now()}
			h.LastRL[ip] = rl
		}

		// return if already banned
		if time.Now().Before(rl.TimeToUnban) {
			h.Mu.Unlock()
			http.Error(w, "Too many requests", http.StatusTooManyRequests)
			return
		}

		// reinitialize the ratelimiter if 20 sec passed
		if time.Since(rl.LastTime) > 50*time.Second {
			rl.Counter = 0
		}

		// return if too may requests
		if time.Since(rl.LastTime) < 10*time.Second && rl.Counter >= 100 {
			rl.TimeToUnban = time.Now().Add(60 * time.Second)
			rl.Counter = 0
			h.Mu.Unlock()
			http.Error(w, "Too many requests", http.StatusTooManyRequests)
			return
		}

		rl.Counter++
		rl.LastTime = time.Now()
		h.Mu.Unlock()

		next(w, r)
	}
}
