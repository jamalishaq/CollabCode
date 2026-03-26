package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config contains runtime configuration loaded from environment variables.
type Config struct {
	Port        string
	RedisURL    string
	JWTSecret   string
	PresenceTTL time.Duration
}

// Load parses environment variables into a Config struct.
func Load() (Config, error) {
	ttlSeconds, err := strconv.Atoi(getEnv("PRESENCE_TTL_SECONDS", "60"))
	if err != nil {
		return Config{}, fmt.Errorf("invalid PRESENCE_TTL_SECONDS: %w", err)
	}

	cfg := Config{
		Port:        getEnv("PORT", "4000"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379/0"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		PresenceTTL: time.Duration(ttlSeconds) * time.Second,
	}

	if cfg.JWTSecret == "" {
		return Config{}, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key string, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
