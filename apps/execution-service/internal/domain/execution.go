package domain

import "time"

// ExecutionRequest is the inbound payload for code execution.
type ExecutionRequest struct {
	Language    string `json:"language"`
	Code        string `json:"code"`
	ExecutionID string `json:"executionId"`
	UserID      string `json:"-"`
}

// ExecutionResult is the canonical execution output payload.
type ExecutionResult struct {
	ExecutionID string `json:"executionId"`
	Stdout      string `json:"stdout"`
	Stderr      string `json:"stderr"`
	ExitCode    int    `json:"exitCode"`
	DurationMs  int64  `json:"durationMs"`
	Language    string `json:"language"`
	TimedOut    bool   `json:"timedOut"`
}

// APIError is returned when an HTTP request fails.
type APIError struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	StatusCode int    `json:"statusCode"`
}

// ExecutionCompletedEvent is published after execution finishes.
type ExecutionCompletedEvent struct {
	Type        string    `json:"type"`
	ExecutionID string    `json:"executionId"`
	UserID      string    `json:"userId"`
	Language    string    `json:"language"`
	Stdout      string    `json:"stdout"`
	Stderr      string    `json:"stderr"`
	ExitCode    int       `json:"exitCode"`
	DurationMs  int64     `json:"durationMs"`
	Timestamp   time.Time `json:"timestamp"`
}

// Error implements error.
func (e APIError) Error() string {
	return e.Message
}
