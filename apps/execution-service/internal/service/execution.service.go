package service

import (
	"context"
	"time"

	"github.com/collabcode/execution-service/internal/domain"
)

// ExecutionService orchestrates execution and publication.
type ExecutionService struct {
	sandbox   *SandboxService
	publisher *PublisherService
}

// NewExecutionService creates an execution service.
func NewExecutionService(sandbox *SandboxService, publisher *PublisherService) *ExecutionService {
	return &ExecutionService{sandbox: sandbox, publisher: publisher}
}

// Run performs execution and asynchronously publishes the result.
func (s *ExecutionService) Run(ctx context.Context, req domain.ExecutionRequest) (domain.ExecutionResult, error) {
	lang, ok := domain.ResolveLanguage(req.Language)
	if !ok {
		return domain.ExecutionResult{}, domain.APIError{
			Code:       "UNSUPPORTED_LANGUAGE",
			Message:    "Language '" + req.Language + "' is not supported",
			StatusCode: 400,
		}
	}

	result, err := s.sandbox.Run(ctx, req, lang)
	if err != nil {
		return result, err
	}

	go func() {
		event := domain.ExecutionCompletedEvent{
			Type:        "execution.completed",
			ExecutionID: req.ExecutionID,
			UserID:      req.UserID,
			Language:    req.Language,
			Stdout:      result.Stdout,
			Stderr:      result.Stderr,
			ExitCode:    result.ExitCode,
			DurationMs:  result.DurationMs,
			Timestamp:   time.Now().UTC(),
		}
		_ = s.publisher.Publish(context.Background(), event)
	}()

	return result, nil
}
