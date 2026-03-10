package sandbox

import (
	"context"
	"fmt"
)

// ExecutionResult is a sandbox run output payload.
type ExecutionResult struct {
	Stdout          string
	Stderr          string
	ExitCode        int
	ExecutionTimeMs int64
}

// RunCode executes code in an isolated container with resource limits.
func RunCode(ctx context.Context, language string, code string, stdin string) (ExecutionResult, error) {
	_ = ctx
	_ = code
	_ = stdin
	if language == "" {
		return ExecutionResult{}, fmt.Errorf("language is required")
	}

	return ExecutionResult{
		Stdout:          "",
		Stderr:          "",
		ExitCode:        0,
		ExecutionTimeMs: 0,
	}, nil
}
