package handler

import (
	"encoding/json"
	"net/http"
	"time"
)

// Health handles GET /health requests.
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"data": map[string]any{
			"status": "ok",
			"uptime": int64(time.Since(h.started).Seconds()),
		},
		"error": nil,
	})
}
