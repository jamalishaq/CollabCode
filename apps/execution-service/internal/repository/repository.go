package repository

import (
	"context"
	"encoding/base64"
	"fmt"
	"os/exec"
	"strings"

	"github.com/collabcode/execution-service/internal/domain"
)

// SandboxRepository wraps Docker CLI operations.
type SandboxRepository struct{}

// NewSandboxRepository creates a docker-backed repository.
func NewSandboxRepository() (*SandboxRepository, error) {
	if _, err := exec.LookPath("docker"); err != nil {
		return nil, fmt.Errorf("docker binary not available: %w", err)
	}
	return &SandboxRepository{}, nil
}

// EnsureImage pulls the image if needed.
func (r *SandboxRepository) EnsureImage(ctx context.Context, imageRef string) error {
	if err := runCommand(ctx, "docker", "image", "inspect", imageRef); err == nil {
		return nil
	}
	return runCommand(ctx, "docker", "pull", imageRef)
}

// CreateContainer creates an isolated execution container.
func (r *SandboxRepository) CreateContainer(ctx context.Context, req domain.ExecutionRequest, lang domain.Language) (string, error) {
	encodedCode := base64.StdEncoding.EncodeToString([]byte(req.Code))
	writeFileCmd := fmt.Sprintf("echo %s | base64 -d > /workspace/%s", encodedCode, lang.FileName)
	executeCmd := strings.Join(lang.RunCmd, " ")
	fullCmd := writeFileCmd + " && " + executeCmd

	containerName := fmt.Sprintf("execution-%s", req.ExecutionID)
	args := []string{
		"create",
		"--name", containerName,
		"--network", "none",
		"--memory", "128m",
		"--cpus", "0.5",
		"--read-only",
		"--security-opt", "no-new-privileges",
		"--tmpfs", "/workspace:rw,nosuid,size=64m",
		"--tmpfs", "/tmp:rw,nosuid,size=64m",
		lang.Image,
		"sh", "-lc", fullCmd,
	}

	out, err := exec.CommandContext(ctx, "docker", args...).CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("docker create failed: %w: %s", err, strings.TrimSpace(string(out)))
	}

	return strings.TrimSpace(string(out)), nil
}

// StartContainer starts an execution container.
func (r *SandboxRepository) StartContainer(ctx context.Context, containerID string) error {
	return runCommand(ctx, "docker", "start", containerID)
}

// WaitContainer waits for a container to finish and returns exit code.
func (r *SandboxRepository) WaitContainer(ctx context.Context, containerID string) (int64, error) {
	out, err := exec.CommandContext(ctx, "docker", "wait", containerID).CombinedOutput()
	if err != nil {
		return 1, err
	}

	trimmed := strings.TrimSpace(string(out))
	var status int64 = 1
	_, parseErr := fmt.Sscan(trimmed, &status)
	if parseErr != nil {
		return 1, parseErr
	}
	return status, nil
}

// Logs reads stdout and stderr logs.
func (r *SandboxRepository) Logs(ctx context.Context, containerID string) (string, string, error) {
	stdout, err := exec.CommandContext(ctx, "docker", "logs", "--stdout", containerID).CombinedOutput()
	if err != nil {
		return "", "", err
	}
	stderr, err := exec.CommandContext(ctx, "docker", "logs", "--stderr", containerID).CombinedOutput()
	if err != nil {
		return "", "", err
	}
	return string(stdout), string(stderr), nil
}

// RemoveContainer force removes a container.
func (r *SandboxRepository) RemoveContainer(ctx context.Context, containerID string) error {
	return runCommand(ctx, "docker", "rm", "-f", containerID)
}

func runCommand(ctx context.Context, name string, args ...string) error {
	out, err := exec.CommandContext(ctx, name, args...).CombinedOutput()
	if err != nil {
		return fmt.Errorf("%s %v failed: %w: %s", name, args, err, strings.TrimSpace(string(out)))
	}
	return nil
}
