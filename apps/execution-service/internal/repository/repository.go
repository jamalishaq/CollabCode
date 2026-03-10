package repository

import (
	"context"

	"github.com/collabcode/execution-service/internal/config"
)

// Repository is a minimal persistence adapter.
type Repository struct {
	config config.Config
}

// NewRepository creates a repository instance.
func NewRepository(cfg config.Config) *Repository {
	return &Repository{config: cfg}
}

// Ping checks backing dependencies.
func (r *Repository) Ping(_ context.Context) error {
	_ = r.config
	return nil
}
