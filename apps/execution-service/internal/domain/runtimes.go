package domain

// RuntimeRegistry maps language names to sandbox docker images.
var RuntimeRegistry = map[string]string{
	"javascript": "node:20-alpine",
	"typescript": "node:20-alpine",
	"python":     "python:3.12-alpine",
	"go":         "golang:1.22-alpine",
	"rust":       "rust:1.79-alpine",
}
