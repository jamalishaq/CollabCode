package middleware

import (
	"log"
	"net/http"
	"time"
)

// Logging logs inbound requests in structured key=value format.
func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("method=%s path=%s durationMs=%d", r.Method, r.URL.Path, time.Since(started).Milliseconds())
	})
}
