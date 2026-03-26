package config

import (
	"os"
	"strconv"
	"time"
)

// Config contains runtime configuration loaded from environment variables.
type Config struct {
	Port                    string
	JWTSecret               string
	QStashURL               string
	QStashToken             string
	MaxConcurrentExecutions int
	ExecutionTimeout        time.Duration
}

// Load parses environment variables into a Config struct.
func Load() Config {
	return Config{
		Port:                    getEnv("PORT", "4001"),
		JWTSecret:               getEnv("JWT_SECRET", ""),
		QStashURL:               getEnv("QSTASH_URL", ""),
		QStashToken:             getEnv("QSTASH_TOKEN", ""),
		MaxConcurrentExecutions: getEnvAsInt("MAX_CONCURRENT_EXECUTIONS", 10),
		ExecutionTimeout:        10 * time.Second,
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}
