package handler

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/collabcode/collaboration-service/internal/domain"
	"github.com/collabcode/collaboration-service/internal/service"
	"github.com/collabcode/collaboration-service/internal/transport/ws"
)

type Handler struct {
	service   *service.Service
	jwtSecret []byte
}

func NewHandler(svc *service.Service, jwtSecret string) *Handler {
	return &Handler{service: svc, jwtSecret: []byte(jwtSecret)}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/health", h.Health)
	mux.HandleFunc("/collaborate/", h.Collaborate)
}

func (h *Handler) Collaborate(w http.ResponseWriter, r *http.Request) {
	documentID := strings.TrimPrefix(r.URL.Path, "/collaborate/")
	if documentID == "" || strings.Contains(documentID, "/") {
		http.Error(w, "invalid document id", http.StatusBadRequest)
		return
	}
	userID, err := h.authenticate(r.URL.Query().Get("token"))
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	conn, err := ws.Upgrade(w, r)
	if err != nil {
		return
	}
	client := &domain.Client{Conn: conn, UserID: userID, DocumentID: documentID, Send: make(chan domain.OutboundMessage, 32)}

	state, err := h.service.Join(context.Background(), client)
	if err != nil {
		_ = conn.Close()
		return
	}
	if len(state) > 0 {
		client.Send <- domain.OutboundMessage{MessageType: domain.MessageBinary, Data: state}
	}
	if users, err := h.service.PresenceSnapshot(context.Background(), documentID); err == nil {
		h.broadcastPresence(h.service.GetOrCreateRoom(documentID), users)
	}
	go h.writePump(client)
	h.readPump(client)
}

func (h *Handler) readPump(client *domain.Client) {
	defer func() {
		ctx := context.Background()
		if users, err := h.service.RemovePresence(ctx, client.DocumentID, client.UserID); err == nil {
			h.broadcastPresence(h.service.GetOrCreateRoom(client.DocumentID), users)
		}
		_ = h.service.Leave(ctx, client)
		close(client.Send)
		_ = client.Conn.Close()
	}()

	for {
		messageType, payload, err := client.Conn.ReadMessage()
		if err != nil {
			return
		}
		switch messageType {
		case domain.MessageBinary:
			if err := h.service.PersistDocument(context.Background(), client.DocumentID, payload); err != nil {
				log.Printf("persist failed: %v", err)
			}
			h.service.Broadcast(h.service.GetOrCreateRoom(client.DocumentID), client, domain.MessageBinary, payload)
		case domain.MessageText:
			var msg domain.PresenceUpdateMessage
			if err := json.Unmarshal(payload, &msg); err != nil || msg.Type != "presence" {
				continue
			}
			p := domain.Presence{UserID: client.UserID, Cursor: msg.Cursor, Color: msg.Color, Name: msg.Name}
			users, err := h.service.UpdatePresence(context.Background(), client.DocumentID, p)
			if err != nil {
				continue
			}
			h.broadcastPresence(h.service.GetOrCreateRoom(client.DocumentID), users)
		}
	}
}

func (h *Handler) writePump(client *domain.Client) {
	for msg := range client.Send {
		if err := client.Conn.WriteMessage(msg.MessageType, msg.Data); err != nil {
			return
		}
	}
}

func (h *Handler) broadcastPresence(room *domain.Room, users []domain.Presence) {
	payload, _ := json.Marshal(domain.PresenceBroadcast{Type: "presence.update", Users: users})
	h.service.Broadcast(room, nil, domain.MessageText, payload)
}

func (h *Handler) authenticate(token string) (string, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return "", domain.ErrUnauthorized
	}
	signed := parts[0] + "." + parts[1]
	sig, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return "", err
	}
	mac := hmac.New(sha256.New, h.jwtSecret)
	mac.Write([]byte(signed))
	if !hmac.Equal(sig, mac.Sum(nil)) {
		return "", domain.ErrUnauthorized
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return "", err
	}
	claims := map[string]any{}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return "", err
	}
	if sub, ok := claims["sub"].(string); ok && sub != "" {
		return sub, nil
	}
	if userID, ok := claims["userId"].(string); ok && userID != "" {
		return userID, nil
	}
	return "", errors.New("missing user id claim")
}
