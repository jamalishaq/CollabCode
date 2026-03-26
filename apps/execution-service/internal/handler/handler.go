package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/collabcode/execution-service/internal/domain"
	"github.com/collabcode/execution-service/internal/service"
)

// Handler owns route handlers and service references.
type Handler struct {
	executionService *service.ExecutionService
	startedAt        time.Time
	semaphore        chan struct{}
}

// NewHandler creates a new handler container.
func NewHandler(executionService *service.ExecutionService, maxConcurrent int) *Handler {
	return &Handler{
		executionService: executionService,
		startedAt:        time.Now(),
		semaphore:        make(chan struct{}, maxConcurrent),
	}
}

// RegisterRoutes registers service HTTP routes.
func (h *Handler) RegisterRoutes(mux *http.ServeMux, executeMiddleware func(http.Handler) http.Handler) {
	mux.HandleFunc("/health", h.Health)
	mux.Handle("/execute", executeMiddleware(http.HandlerFunc(h.Execute)))
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeExecuteSuccess(w http.ResponseWriter, result domain.ExecutionResult) {
	writeJSON(w, http.StatusOK, map[string]any{
		"data":  result,
		"error": nil,
	})
}

func writeExecuteError(w http.ResponseWriter, apiErr domain.APIError) {
	writeJSON(w, apiErr.StatusCode, map[string]any{
		"data": nil,
		"error": map[string]any{
			"code":       apiErr.Code,
			"message":    apiErr.Message,
			"statusCode": apiErr.StatusCode,
		},
	})
}

func toAPIError(err error) domain.APIError {
	var apiErr domain.APIError
	if errors.As(err, &apiErr) {
		return apiErr
	}
	return domain.APIError{Code: "INTERNAL_ERROR", Message: "Internal server error", StatusCode: 500}
}
