package domain

import "errors"

var (
	// ErrFileLocked indicates a pessimistic lock already exists.
	ErrFileLocked = errors.New("file is locked")
	// ErrNotFound indicates an entity lookup failed.
	ErrNotFound = errors.New("entity not found")
)
