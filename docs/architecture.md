# CollabCode Architecture

CollabCode is a microservices monorepo composed of TypeScript and Go services.
The api-gateway fronts Node domain services while collaboration and execution run in Go.
Primary flows:
- Auth: frontend -> api-gateway -> auth-service
- Workspace/file CRUD: frontend -> api-gateway -> workspace-service/file-service
- Realtime: frontend websocket -> collaboration-service
- Execution: frontend -> execution-service
Data stores: PostgreSQL, Redis.
Messaging Queue: QStash
