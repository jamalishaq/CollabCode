package handler

import (
	"encoding/json"
	"net/http"
)

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	status, err := h.service.Health(r.Context())
	if err != nil {
		http.Error(w, "service unavailable", http.StatusServiceUnavailable)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(status)
}
