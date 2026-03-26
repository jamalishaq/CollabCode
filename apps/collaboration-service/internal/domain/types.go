package domain

import "sync"

const (
	MessageText   = 1
	MessageBinary = 2
)

// HealthStatus represents health endpoint payload.
type HealthStatus struct {
	Status string `json:"status"`
	Uptime int64  `json:"uptime"`
}

type CursorPosition struct {
	Line   int `json:"line"`
	Column int `json:"column"`
}

type Presence struct {
	UserID string          `json:"userId"`
	Cursor *CursorPosition `json:"cursor,omitempty"`
	Color  string          `json:"color,omitempty"`
	Name   string          `json:"name,omitempty"`
}

type PresenceUpdateMessage struct {
	Type   string          `json:"type"`
	UserID string          `json:"userId,omitempty"`
	Cursor *CursorPosition `json:"cursor,omitempty"`
	Color  string          `json:"color,omitempty"`
	Name   string          `json:"name,omitempty"`
}

type PresenceBroadcast struct {
	Type  string     `json:"type"`
	Users []Presence `json:"users"`
}

type WSConn interface {
	ReadMessage() (int, []byte, error)
	WriteMessage(messageType int, data []byte) error
	Close() error
}

type Client struct {
	Conn       WSConn
	UserID     string
	DocumentID string
	Send       chan OutboundMessage
}

type OutboundMessage struct {
	MessageType int
	Data        []byte
}

type Room struct {
	DocumentID string
	Clients    map[*Client]struct{}
	Mu         sync.RWMutex
}
