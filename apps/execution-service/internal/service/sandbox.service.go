package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/collabcode/execution-service/internal/domain"
	"github.com/collabcode/execution-service/internal/repository"
)

// SandboxService manages lifecycle for execution containers.
type SandboxService struct {
	repo    *repository.SandboxRepository
	timeout time.Duration
}

// NewSandboxService creates a sandbox service.
func NewSandboxService(repo *repository.SandboxRepository, timeout time.Duration) *SandboxService {
	return &SandboxService{repo: repo, timeout: timeout}
}

// Run executes code and captures logs and exit code.
func (s *SandboxService) Run(ctx context.Context, req domain.ExecutionRequest, lang domain.Language) (domain.ExecutionResult, error) {
	start := time.Now()
	result := domain.ExecutionResult{
		ExecutionID: req.ExecutionID,
		Language:    req.Language,
	}

	if err := s.repo.EnsureImage(ctx, lang.Image); err != nil {
		return result, err
	}

	containerID, err := s.repo.CreateContainer(ctx, req, lang)
	if err != nil {
		return result, err
	}
	defer func() {
		_ = s.repo.RemoveContainer(context.Background(), containerID)
	}()

	if err := s.repo.StartContainer(ctx, containerID); err != nil {
		return result, err
	}

	waitCtx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	exitCode, err := s.repo.WaitContainer(waitCtx, containerID)
	if err != nil {
		if errors.Is(waitCtx.Err(), context.DeadlineExceeded) {
			_ = s.repo.RemoveContainer(context.Background(), containerID)
			result.ExitCode = 1
			result.Stderr = fmt.Sprintf("Execution timed out after %d seconds", int(s.timeout.Seconds()))
			result.TimedOut = true
			result.DurationMs = s.timeout.Milliseconds()
			return result, nil
		}
		return result, err
	}

	stdout, stderr, err := s.repo.Logs(ctx, containerID)
	if err != nil {
		return result, err
	}

	result.Stdout = stdout
	result.Stderr = stderr
	result.ExitCode = int(exitCode)
	result.DurationMs = time.Since(start).Milliseconds()
	return result, nil
}
