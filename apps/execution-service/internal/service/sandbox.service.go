package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/collabcode/execution-service/internal/domain"
	"github.com/collabcode/execution-service/internal/repository"
)

// SandboxService manages lifecycle for execution runs.
type SandboxService struct {
	repo    *repository.SandboxRepository
	timeout time.Duration
}

// NewSandboxService creates a sandbox service.
func NewSandboxService(repo *repository.SandboxRepository, timeout time.Duration) *SandboxService {
	return &SandboxService{repo: repo, timeout: timeout}
}

// Run executes code and captures output.
func (s *SandboxService) Run(ctx context.Context, req domain.ExecutionRequest, lang domain.Language) (domain.ExecutionResult, error) {
	start := time.Now()
	result := domain.ExecutionResult{
		ExecutionID: req.ExecutionID,
		Language:    req.Language,
	}

	runCtx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	stdout, stderr, exitCode, err := s.repo.Execute(runCtx, req, lang)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			result.ExitCode = 1
			result.Stderr = fmt.Sprintf("Execution timed out after %d seconds", int(s.timeout.Seconds()))
			result.TimedOut = true
			result.DurationMs = s.timeout.Milliseconds()
			return result, nil
		}
		return result, err
	}

	result.Stdout = stdout
	result.Stderr = stderr
	result.ExitCode = exitCode
	result.DurationMs = time.Since(start).Milliseconds()
	return result, nil
}
