package repository

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/collabcode/execution-service/internal/domain"
)

// SandboxRepository executes code in an isolated process workspace.
type SandboxRepository struct{}

// NewSandboxRepository creates a process-backed repository.
func NewSandboxRepository() *SandboxRepository {
	return &SandboxRepository{}
}

// Execute writes source to a temp workspace and runs it using local runtime binaries.
func (r *SandboxRepository) Execute(ctx context.Context, req domain.ExecutionRequest, lang domain.Language) (string, string, int, error) {
	tempDir, err := os.MkdirTemp("", "execution-"+req.ExecutionID+"-")
	if err != nil {
		return "", "", 1, err
	}
	defer os.RemoveAll(tempDir)

	sourceFile := filepath.Join(tempDir, lang.FileName)
	if err := os.WriteFile(sourceFile, []byte(req.Code), 0o600); err != nil {
		return "", "", 1, err
	}

	command := lang.CommandForFile(sourceFile)
	if len(command) == 0 {
		return "", "", 1, fmt.Errorf("runtime command not configured for %s", lang.Name)
	}

	cmd := exec.CommandContext(ctx, command[0], command[1:]...)
	cmd.Dir = tempDir

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	runErr := cmd.Run()
	if runErr == nil {
		return stdout.String(), stderr.String(), 0, nil
	}

	if errors.Is(ctx.Err(), context.DeadlineExceeded) {
		return stdout.String(), stderr.String(), 1, ctx.Err()
	}

	var exitErr *exec.ExitError
	if errors.As(runErr, &exitErr) {
		return stdout.String(), stderr.String(), exitErr.ExitCode(), nil
	}

	return stdout.String(), stderr.String(), 1, runErr
}
