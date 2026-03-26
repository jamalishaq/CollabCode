package handler

import (
	"net/http"
	"time"
)

// Health handles GET /health.
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status": "ok",
		"uptime": int64(time.Since(h.startedAt).Seconds()),
	})
}
