# Collaboration Service

Real-time WebSocket server that relays Yjs CRDT updates between clients
and tracks user presence in shared editing sessions.

---

## Responsibilities

- Accept and manage WebSocket connections per document room
- Relay binary Yjs update messages between all clients in the same room
- Persist Yjs document state to Redis so late-joining clients get the
  full document without replaying all history
- Track user presence (who is online, cursor positions) in Redis
- Broadcast presence updates to all clients in the room
- Authenticate WebSocket connections via JWT on handshake

---

## Endpoints

### WebSocket `WS /collaborate/:documentId`
Establish a WebSocket connection to a document room.

**Handshake:**
JWT must be passed as a query parameter on connection:
```
ws://collaboration-service:4000/collaborate/doc-uuid?token=eyJ...
```

The server validates the JWT on connection. Invalid tokens are rejected
with close code `4001`.

**Message Types (binary protocol — Yjs):**

All Yjs messages are binary `Uint8Array`. The service does not parse
or interpret the content — it relays them to all other clients in the room.

**Presence messages (JSON):**
```json
{
  "type": "presence",
  "userId": "uuid",
  "cursor": { "line": 10, "column": 5 },
  "color": "#FF6B6B",
  "name": "Jamal Ishaq"
}
```

**Presence broadcast (sent to all clients in room):**
```json
{
  "type": "presence.update",
  "users": [
    {
      "userId": "uuid",
      "cursor": { "line": 10, "column": 5 },
      "color": "#FF6B6B",
      "name": "Jamal Ishaq"
    }
  ]
}
```

---

### GET `/health`
Health check endpoint.

**Response `200`:**
```json
{ "status": "ok", "uptime": 3600 }
```

---

## Service Communication

Collaboration service operates independently. It does not call other services.
```
Client A ──► WS /collaborate/:docId ──► Collaboration Service ──► Client B
                                               │
                                               ▼
                                           Redis
                                     (document state + presence)
```

The frontend connects directly to collaboration-service — not via the
API Gateway — because WebSocket proxying adds unnecessary latency.

---

## Concurrency Control

- Each document room is managed by a `Room` struct in memory
- A `sync.RWMutex` protects the client map — reads (broadcasts) use
  `RLock`, writes (join/leave) use `Lock`
- Redis is the source of truth for document state — in-memory state is
  rebuilt from Redis on service restart
- Presence updates use Redis HSET with TTL — stale presence entries
  expire automatically if a client disconnects without sending a leave event
- Document state persistence uses Redis APPEND for incremental updates
  and periodic snapshots to cap memory usage

---

## Low Level Design

### Folder Structure
```
internal/
├── config/
│   └── config.go         — Env loading and typed config struct
├── domain/
│   └── room.go           — Room struct with client map and mutex
│   └── client.go         — Client struct representing one WebSocket connection
│   └── presence.go       — Presence data structures
├── handler/
│   └── ws.go             — WebSocket upgrade, message relay, presence broadcast
│   └── health.go         — Health check HTTP handler
├── service/
│   └── room.service.go   — Room lifecycle: create, join, leave, broadcast
│   └── presence.service.go — Presence tracking in Redis
│   └── document.service.go — Document state persistence in Redis
├── repository/
│   └── document.repo.go  — Redis operations for Yjs document state
│   └── presence.repo.go  — Redis operations for presence data
├── middleware/
│   └── auth.go           — JWT validation on WebSocket handshake
└── cmd/
    ├── server/
    │   └── main.go       — Server bootstrap, router setup
    └── healthcheck/
        └── main.go       — Standalone health check binary for Docker
```

### Handlers
| Name | Description |
|---|---|
| `WSHandler.HandleConnect` | Upgrades HTTP to WebSocket, authenticates JWT, joins room |
| `WSHandler.HandleMessage` | Receives binary Yjs update, relays to room, persists to Redis |
| `WSHandler.HandlePresence` | Receives presence JSON, updates Redis, broadcasts to room |
| `WSHandler.HandleDisconnect` | Removes client from room, clears presence from Redis |
| `HealthHandler.Check` | Returns service status and uptime |

### Services
| Name | Description |
|---|---|
| `RoomService.GetOrCreate` | Returns existing room or creates new one |
| `RoomService.Join` | Adds client to room, sends current document state |
| `RoomService.Leave` | Removes client, broadcasts updated presence |
| `RoomService.Broadcast` | Sends message to all clients in room except sender |
| `PresenceService.Update` | Stores cursor and user info in Redis with TTL |
| `PresenceService.GetAll` | Returns all active users in a room |
| `PresenceService.Remove` | Deletes presence entry for disconnected user |
| `DocumentService.Append` | Appends Yjs binary update to Redis document state |
| `DocumentService.GetState` | Returns full document state for new joiners |
| `DocumentService.Snapshot` | Compacts document state in Redis periodically |

### Repositories
| Name | Description |
|---|---|
| `DocumentRepository.Append` | Redis APPEND on document key |
| `DocumentRepository.Get` | Redis GET for full document state |
| `DocumentRepository.Set` | Redis SET for compacted snapshots |
| `PresenceRepository.Set` | Redis HSET user presence with TTL |
| `PresenceRepository.GetAll` | Redis HGETALL for room presence |
| `PresenceRepository.Delete` | Redis HDEL for disconnected user |

### Domain Structs
| Name | Description |
|---|---|
| `Room` | Holds client map, mutex, and document ID |
| `Client` | Holds WebSocket conn, userId, and send channel |
| `Presence` | Holds userId, cursor position, color, and display name |

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the service listens on |
| `REDIS_URL` | Upstash Redis TLS connection string |
| `JWT_SECRET` | For validating WebSocket handshake tokens |