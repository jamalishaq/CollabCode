package repository

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"time"

	"github.com/collabcode/collaboration-service/internal/domain"
	"github.com/collabcode/collaboration-service/internal/transport/redisresp"
)

type RedisRepository struct {
	client      *redisresp.Client
	presenceTTL time.Duration
}

func NewRedisRepository(redisURL string, presenceTTL time.Duration) (*RedisRepository, error) {
	client, err := redisresp.New(redisURL)
	if err != nil {
		return nil, fmt.Errorf("connect redis: %w", err)
	}
	return &RedisRepository{client: client, presenceTTL: presenceTTL}, nil
}

func documentKey(documentID string) string { return "doc:" + documentID + ":state" }
func presenceKey(documentID string) string { return "doc:" + documentID + ":presence" }

func (r *RedisRepository) Ping(_ context.Context) error {
	_, err := r.client.Do("PING")
	return err
}

func (r *RedisRepository) Append(_ context.Context, stringID string, data []byte) error {
	_, err := r.client.Do("APPEND", documentKey(stringID), base64.StdEncoding.EncodeToString(data))
	return err
}

func (r *RedisRepository) Get(_ context.Context, documentID string) ([]byte, error) {
	res, err := r.client.Do("GET", documentKey(documentID))
	if err != nil || res == nil {
		return nil, err
	}
	s, _ := res.(string)
	if s == "" {
		return nil, nil
	}
	return base64.StdEncoding.DecodeString(s)
}

func (r *RedisRepository) Set(_ context.Context, documentID string, data []byte) error {
	_, err := r.client.Do("SET", documentKey(documentID), base64.StdEncoding.EncodeToString(data))
	return err
}

func (r *RedisRepository) SetPresence(_ context.Context, documentID, userID string, presence domain.Presence) error {
	payload, err := json.Marshal(presence)
	if err != nil {
		return err
	}
	if _, err := r.client.Do("HSET", presenceKey(documentID), userID, string(payload)); err != nil {
		return err
	}
	_, err = r.client.Do("EXPIRE", presenceKey(documentID), strconv.Itoa(int(r.presenceTTL.Seconds())))
	return err
}

func (r *RedisRepository) GetAllPresence(_ context.Context, documentID string) ([]domain.Presence, error) {
	res, err := r.client.Do("HGETALL", presenceKey(documentID))
	if err != nil || res == nil {
		return nil, err
	}
	arr, ok := res.([]any)
	if !ok {
		return nil, nil
	}
	users := make([]domain.Presence, 0, len(arr)/2)
	for i := 1; i < len(arr); i += 2 {
		raw, _ := arr[i].(string)
		var p domain.Presence
		if json.Unmarshal([]byte(raw), &p) == nil {
			users = append(users, p)
		}
	}
	sort.Slice(users, func(i, j int) bool { return users[i].UserID < users[j].UserID })
	return users, nil
}

func (r *RedisRepository) DeletePresence(_ context.Context, documentID, userID string) error {
	_, err := r.client.Do("HDEL", presenceKey(documentID), userID)
	return err
}
