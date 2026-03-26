package domain

import "errors"

var (
	ErrUnauthorized = errors.New("unauthorized")
	ErrBadMessage   = errors.New("bad message")
)
