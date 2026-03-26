package service

import (
	"context"
	"sync"
	"time"

	"github.com/collabcode/collaboration-service/internal/domain"
	"github.com/collabcode/collaboration-service/internal/repository"
)

type Service struct {
	started time.Time
	repo    *repository.RedisRepository
	rooms   map[string]*domain.Room
	roomsMu sync.RWMutex
}

func NewService(repo *repository.RedisRepository) *Service {
	return &Service{started: time.Now(), repo: repo, rooms: map[string]*domain.Room{}}
}

func (s *Service) Health(ctx context.Context) (domain.HealthStatus, error) {
	if err := s.repo.Ping(ctx); err != nil {
		return domain.HealthStatus{}, err
	}
	return domain.HealthStatus{Status: "ok", Uptime: int64(time.Since(s.started).Seconds())}, nil
}

func (s *Service) GetOrCreateRoom(documentID string) *domain.Room {
	s.roomsMu.RLock()
	room, ok := s.rooms[documentID]
	s.roomsMu.RUnlock()
	if ok {
		return room
	}
	s.roomsMu.Lock()
	defer s.roomsMu.Unlock()
	if room, ok = s.rooms[documentID]; ok {
		return room
	}
	room = &domain.Room{DocumentID: documentID, Clients: map[*domain.Client]struct{}{}}
	s.rooms[documentID] = room
	return room
}

func (s *Service) Join(ctx context.Context, c *domain.Client) ([]byte, error) {
	room := s.GetOrCreateRoom(c.DocumentID)
	room.Mu.Lock()
	room.Clients[c] = struct{}{}
	room.Mu.Unlock()
	return s.repo.Get(ctx, c.DocumentID)
}

func (s *Service) Leave(ctx context.Context, c *domain.Client) error {
	room := s.GetOrCreateRoom(c.DocumentID)
	room.Mu.Lock()
	delete(room.Clients, c)
	empty := len(room.Clients) == 0
	room.Mu.Unlock()
	if empty {
		s.roomsMu.Lock()
		delete(s.rooms, c.DocumentID)
		s.roomsMu.Unlock()
	}
	return s.repo.DeletePresence(ctx, c.DocumentID, c.UserID)
}

func (s *Service) Broadcast(room *domain.Room, sender *domain.Client, messageType int, payload []byte) {
	room.Mu.RLock()
	defer room.Mu.RUnlock()
	for client := range room.Clients {
		if sender != nil && client == sender {
			continue
		}
		select {
		case client.Send <- domain.OutboundMessage{MessageType: messageType, Data: payload}:
		default:
		}
	}
}

func (s *Service) PersistDocument(ctx context.Context, documentID string, update []byte) error {
	return s.repo.Append(ctx, documentID, update)
}

func (s *Service) UpdatePresence(ctx context.Context, documentID string, p domain.Presence) ([]domain.Presence, error) {
	if err := s.repo.SetPresence(ctx, documentID, p.UserID, p); err != nil {
		return nil, err
	}
	return s.repo.GetAllPresence(ctx, documentID)
}

func (s *Service) RemovePresence(ctx context.Context, documentID, userID string) ([]domain.Presence, error) {
	if err := s.repo.DeletePresence(ctx, documentID, userID); err != nil {
		return nil, err
	}
	return s.repo.GetAllPresence(ctx, documentID)
}

func (s *Service) PresenceSnapshot(ctx context.Context, documentID string) ([]domain.Presence, error) {
	return s.repo.GetAllPresence(ctx, documentID)
}
