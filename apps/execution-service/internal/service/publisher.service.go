package service

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"

	"github.com/collabcode/execution-service/internal/domain"
)

// PublisherService publishes execution results to QStash.
type PublisherService struct {
	url   string
	token string
	http  *http.Client
}

// NewPublisherService creates a publisher service.
func NewPublisherService(url, token string) *PublisherService {
	return &PublisherService{url: url, token: token, http: &http.Client{}}
}

// Publish posts an execution completed event. No-op when config missing.
func (p *PublisherService) Publish(ctx context.Context, event domain.ExecutionCompletedEvent) error {
	if p.url == "" || p.token == "" {
		return nil
	}

	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.url, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.token)

	resp, err := p.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}
