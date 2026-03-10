package service

import (
	"context"
	"time"

	"github.com/collabcode/collaboration-service/internal/domain"
)

// service is the default domain.Service implementation.
type service struct {
	repository domain.Repository
}

// NewService creates a new domain service.
func NewService(repository domain.Repository) domain.Service {
	return &service{repository: repository}
}

// Health returns service health metadata.
func (s *service) Health(_ context.Context) (domain.HealthStatus, error) {
	return domain.HealthStatus{Status: "ok", Uptime: int64(time.Now().Unix())}, nil
}
