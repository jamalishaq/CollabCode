package handler

import (
	"net/http"
	"time"

	"github.com/collabcode/execution-service/internal/domain"
)

// Handler is the HTTP handler container.
type Handler struct {
	service domain.Service
	started time.Time
}

// NewHandler creates a new Handler.
func NewHandler(service domain.Service) *Handler {
	return &Handler{service: service, started: time.Now()}
}

// RegisterRoutes registers HTTP endpoints.
func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/health", h.Health)
}
