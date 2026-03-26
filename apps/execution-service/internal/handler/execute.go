package handler

import (
	"encoding/json"
	"net/http"

	"github.com/collabcode/execution-service/internal/domain"
	"github.com/collabcode/execution-service/internal/middleware"
)

// Execute handles POST /execute.
func (h *Handler) Execute(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	var req domain.ExecutionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeExecuteError(w, domain.APIError{Code: "INVALID_REQUEST", Message: "Invalid JSON payload", StatusCode: 400})
		return
	}

	if req.Language == "" || req.Code == "" || req.ExecutionID == "" {
		writeExecuteError(w, domain.APIError{Code: "INVALID_REQUEST", Message: "language, code, and executionId are required", StatusCode: 400})
		return
	}

	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok || userID == "" {
		writeExecuteError(w, domain.APIError{Code: "UNAUTHORIZED", Message: "Missing user identity", StatusCode: 401})
		return
	}
	req.UserID = userID

	select {
	case h.semaphore <- struct{}{}:
		defer func() { <-h.semaphore }()
	default:
		writeExecuteError(w, domain.APIError{Code: "SERVICE_UNAVAILABLE", Message: "Execution service is at capacity", StatusCode: 503})
		return
	}

	result, err := h.executionService.Run(r.Context(), req)
	if err != nil {
		writeExecuteError(w, toAPIError(err))
		return
	}

	writeExecuteSuccess(w, result)
}
