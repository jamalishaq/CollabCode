package domain

import "context"

// HealthStatus represents health endpoint payload.
type HealthStatus struct {
	Status string `json:"status"`
	Uptime int64  `json:"uptime"`
}

// Repository defines required persistence operations.
type Repository interface {
	Ping(ctx context.Context) error
}

// Service defines business operations.
type Service interface {
	Health(ctx context.Context) (HealthStatus, error)
}
