# Workspace Service

Manages workspaces, projects, and role-based access control (RBAC). Controls
who can view, edit, or administer each workspace and project.

---

## Responsibilities

- Create, read, update, and delete workspaces
- Create, read, update, and delete projects within workspaces
- Manage workspace membership and roles (Owner, Editor, Viewer)
- Enforce RBAC on every operation
- Publish events to QStash when members are invited or workspaces are created

---

## Endpoints

### Workspaces

#### POST `/workspaces`
Create a new workspace. The authenticated user becomes the Owner.

**Request:**
```json
{
  "name": "My Team",
  "description": "Our shared workspace"
}
```

**Response `201`:**
```json
{
  "data": {
    "id": "uuid",
    "name": "My Team",
    "description": "Our shared workspace",
    "ownerId": "uuid",
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "error": null
}
```

---

#### GET `/workspaces`
List all workspaces the authenticated user is a member of.

**Response `200`:**
```json
{
  "data": {
    "workspaces": [
      {
        "id": "uuid",
        "name": "My Team",
        "role": "owner",
        "memberCount": 4
      }
    ]
  },
  "error": null
}
```

---

#### GET `/workspaces/:workspaceId`
Get a single workspace by ID. Requires membership.

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "name": "My Team",
    "description": "Our shared workspace",
    "ownerId": "uuid",
    "members": [
      { "userId": "uuid", "role": "owner" },
      { "userId": "uuid", "role": "editor" }
    ],
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "error": null
}
```

---

#### PATCH `/workspaces/:workspaceId`
Update workspace name or description. Requires Owner role.

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Updated Name",
    "description": "Updated description"
  },
  "error": null
}
```

---

#### DELETE `/workspaces/:workspaceId`
Delete a workspace and all its projects. Requires Owner role.

**Response `200`:**
```json
{
  "data": { "success": true },
  "error": null
}
```

---

### Members

#### POST `/workspaces/:workspaceId/members`
Invite a user to a workspace. Requires Owner role. Publishes
`member-invited` event to QStash.

**Request:**
```json
{
  "email": "newmember@example.com",
  "role": "editor"
}
```

**Response `201`:**
```json
{
  "data": {
    "userId": "uuid",
    "workspaceId": "uuid",
    "role": "editor"
  },
  "error": null
}
```

---

#### PATCH `/workspaces/:workspaceId/members/:userId`
Update a member's role. Requires Owner role.

**Request:**
```json
{
  "role": "viewer"
}
```

**Response `200`:**
```json
{
  "data": {
    "userId": "uuid",
    "role": "viewer"
  },
  "error": null
}
```

---

#### DELETE `/workspaces/:workspaceId/members/:userId`
Remove a member from a workspace. Requires Owner role.

**Response `200`:**
```json
{
  "data": { "success": true },
  "error": null
}
```

---

### Projects

#### POST `/workspaces/:workspaceId/projects`
Create a project inside a workspace. Requires Editor or Owner role.

**Request:**
```json
{
  "name": "Backend API"
}
```

**Response `201`:**
```json
{
  "data": {
    "id": "uuid",
    "workspaceId": "uuid",
    "name": "Backend API",
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "error": null
}
```

---

#### GET `/workspaces/:workspaceId/projects`
List all projects in a workspace. Requires membership.

**Response `200`:**
```json
{
  "data": {
    "projects": [
      { "id": "uuid", "name": "Backend API", "createdAt": "2025-01-01T00:00:00Z" }
    ]
  },
  "error": null
}
```

---

#### GET `/workspaces/:workspaceId/projects/:projectId`
Get a single project. Requires membership.

---

#### PATCH `/workspaces/:workspaceId/projects/:projectId`
Rename a project. Requires Editor or Owner role.

---

#### DELETE `/workspaces/:workspaceId/projects/:projectId`
Delete a project and all its files. Requires Owner role.

---

### GET `/health`
Health check endpoint.

---

## Service Communication

### Outbound — QStash (async)

Workspace service publishes events to QStash after successful operations.
QStash delivers them to notification-service via HTTP webhook.

#### Event: `workspace.member.invited`
Published after a member is successfully added.

**Payload published to QStash:**
```json
{
  "type": "workspace.member.invited",
  "workspaceId": "uuid",
  "workspaceName": "My Team",
  "invitedEmail": "newmember@example.com",
  "invitedByName": "Jamal Ishaq",
  "role": "editor",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

#### Event: `workspace.created`
Published after a workspace is successfully created.

**Payload:**
```json
{
  "type": "workspace.created",
  "workspaceId": "uuid",
  "workspaceName": "My Team",
  "ownerId": "uuid",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### Inbound — API Gateway (sync)
All requests arrive via the API Gateway which has already validated the JWT.
The `userId` is forwarded in the `x-user-id` request header.

---

## Concurrency Control

- All workspace mutations use Prisma transactions to prevent partial writes
- Role checks are performed inside the same transaction as the mutation
  ensuring a role cannot change between the check and the write
- Member invitation uses `upsert` with a unique constraint on
  `(workspaceId, userId)` — concurrent invites for the same user resolve
  to one record without duplicates

---

## Low Level Design

### Folder Structure
```
src/
├── config/
│   └── index.ts               — Zod env schema, typed config export
├── controllers/
│   └── workspace.controller.ts — Workspace CRUD HTTP handlers
│   └── member.controller.ts   — Member management HTTP handlers
│   └── project.controller.ts  — Project CRUD HTTP handlers
├── services/
│   └── workspace.service.ts   — Workspace business logic and RBAC enforcement
│   └── member.service.ts      — Member invitation and role management
│   └── project.service.ts     — Project business logic
│   └── authorization.service.ts — RBAC role checks used across all services
├── repositories/
│   └── workspace.repository.ts — Prisma queries for workspace CRUD
│   └── member.repository.ts   — Prisma queries for membership
│   └── project.repository.ts  — Prisma queries for project CRUD
├── events/
│   └── producer.ts            — QStash publish helper
├── middleware/
│   └── auth.middleware.ts     — Extracts userId from x-user-id header
│   └── validate.middleware.ts — Zod request validation
│   └── error.middleware.ts    — Global error handler
├── routes/
│   └── workspace.route.ts     — Workspace and member route registration
│   └── project.route.ts       — Project route registration
│   └── health.route.ts        — Health check route
├── utils/
│   └── catch-async.ts         — Async handler wrapper
└── index.ts                   — Server bootstrap
```

### Controllers
| Name | Description |
|---|---|
| `WorkspaceController.create` | Creates workspace, returns 201 |
| `WorkspaceController.list` | Returns all workspaces for authenticated user |
| `WorkspaceController.getById` | Returns single workspace with members |
| `WorkspaceController.update` | Updates name or description |
| `WorkspaceController.delete` | Deletes workspace and cascades to projects |
| `MemberController.invite` | Adds member, publishes QStash event |
| `MemberController.updateRole` | Changes member role |
| `MemberController.remove` | Removes member from workspace |
| `ProjectController.create` | Creates project inside workspace |
| `ProjectController.list` | Lists all projects in workspace |
| `ProjectController.getById` | Returns single project |
| `ProjectController.update` | Renames project |
| `ProjectController.delete` | Deletes project |

### Services
| Name | Description |
|---|---|
| `WorkspaceService.create` | Creates workspace, adds creator as Owner |
| `WorkspaceService.list` | Fetches all workspaces user is member of |
| `WorkspaceService.getById` | Fetches workspace with members, checks access |
| `WorkspaceService.update` | Validates Owner role, updates workspace |
| `WorkspaceService.delete` | Validates Owner role, deletes workspace |
| `MemberService.invite` | Validates role, adds member, publishes event |
| `MemberService.updateRole` | Validates Owner role, updates member role |
| `MemberService.remove` | Validates Owner role, removes member |
| `ProjectService.create` | Validates Editor/Owner role, creates project |
| `ProjectService.list` | Validates membership, returns projects |
| `ProjectService.update` | Validates Editor/Owner role, updates project |
| `ProjectService.delete` | Validates Owner role, deletes project |
| `AuthorizationService.requireRole` | Throws ForbiddenError if user lacks required role |
| `AuthorizationService.isMember` | Returns true if user is member of workspace |

### Repositories
| Name | Description |
|---|---|
| `WorkspaceRepository.create` | Insert workspace and first member in transaction |
| `WorkspaceRepository.findAllForUser` | Find all workspaces where user is member |
| `WorkspaceRepository.findById` | Find workspace with members by ID |
| `WorkspaceRepository.update` | Update workspace fields |
| `WorkspaceRepository.delete` | Delete workspace (cascades to projects) |
| `MemberRepository.create` | Insert workspace member record |
| `MemberRepository.findByWorkspace` | List all members of a workspace |
| `MemberRepository.findMembership` | Find specific user-workspace membership |
| `MemberRepository.updateRole` | Update member role |
| `MemberRepository.delete` | Remove member from workspace |
| `ProjectRepository.create` | Insert project record |
| `ProjectRepository.findAllByWorkspace` | List projects in workspace |
| `ProjectRepository.findById` | Find project by ID |
| `ProjectRepository.update` | Update project fields |
| `ProjectRepository.delete` | Delete project |

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the service listens on |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `REDIS_URL` | Upstash Redis TLS connection string |
| `JWT_SECRET` | For validating forwarded tokens |
| `QSTASH_URL` | QStash endpoint URL |
| `QSTASH_TOKEN` | QStash auth token |
| `LOGTAIL_SOURCE_TOKEN` | Logtail token for log shipping |