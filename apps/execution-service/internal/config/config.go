package config

import "os"

// Config contains runtime configuration loaded from environment variables.
type Config struct {
	Port                  string
	AppEnv                string
	RedisAddr             string
	KafkaBrokers          string
	MaxExecutionTimeoutMs string
}

// Load parses environment variables into a Config struct.
func Load() Config {
	return Config{
		Port:                  getEnv("PORT", "4001"),
		AppEnv:                getEnv("APP_ENV", "development"),
		RedisAddr:             getEnv("REDIS_ADDR", "localhost:6379"),
		KafkaBrokers:          getEnv("KAFKA_BROKERS", "localhost:9092"),
		MaxExecutionTimeoutMs: getEnv("MAX_EXECUTION_TIMEOUT_MS", "10000"),
	}
}

func getEnv(key string, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
