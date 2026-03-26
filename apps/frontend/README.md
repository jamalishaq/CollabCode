# Frontend

React single-page application powered by Monaco Editor. Provides the
collaborative code editing interface, workspace management UI, and
real-time presence indicators.

---

## Responsibilities

- Render the Monaco Editor with syntax highlighting and IntelliSense
- Connect to collaboration-service via WebSocket for real-time CRDT sync
- Display live cursor positions and presence indicators for collaborators
- Manage workspace and project navigation
- Handle authentication flow including OAuth2 redirects
- Acquire and display file lock status before allowing edits
- Submit code execution requests and display results

---

## Pages and Routes

| Route | Page | Description |
|---|---|---|
| `/` | `LandingPage` | Marketing page with login and register links |
| `/login` | `LoginPage` | Email/password login and OAuth2 buttons |
| `/register` | `RegisterPage` | New user registration form |
| `/dashboard` | `DashboardPage` | Lists all workspaces the user belongs to |
| `/workspaces/:workspaceId` | `WorkspacePage` | Projects list and member management |
| `/workspaces/:workspaceId/projects/:projectId` | `EditorPage` | Full editor with file tree |

---

## Key Components

### Editor
| Component | Description |
|---|---|
| `Editor` | Monaco Editor wrapper with language detection and theme config |
| `EditorToolbar` | Run button, language selector, and save indicator |
| `ExecutionPanel` | Displays stdout, stderr, exit code, and duration |
| `PresenceBar` | Shows avatars of users currently in the same document |
| `CursorOverlay` | Renders remote cursor positions and user name labels |

### File Tree
| Component | Description |
|---|---|
| `FileTree` | Hierarchical list of files in the current project |
| `FileTreeItem` | Single file entry with lock status indicator |
| `NewFileDialog` | Modal for creating a new file |

### Workspace
| Component | Description |
|---|---|
| `WorkspacePanel` | Sidebar showing workspace name and project list |
| `WorkspaceCard` | Dashboard card for a single workspace |
| `InviteMemberDialog` | Modal for inviting a new member by email and role |
| `MemberList` | Lists current members with their roles |

### Auth
| Component | Description |
|---|---|
| `LoginForm` | Email and password inputs with validation |
| `RegisterForm` | Name, email, password inputs with validation |
| `OAuthButton` | GitHub and Google OAuth2 login buttons |

---

## State Management

State is split across Zustand stores and React Query:

### Zustand Stores (client state)

| Store | Description |
|---|---|
| `authStore` | Current user, access token, login and logout actions |
| `editorStore` | Active file, language, unsaved changes, editor instance ref |
| `workspaceStore` | Active workspace, active project, member list |

### React Query (server state)

| Query Key | Description |
|---|---|
| `['workspaces']` | All workspaces for current user |
| `['workspace', id]` | Single workspace with members |
| `['projects', workspaceId]` | All projects in workspace |
| `['files', projectId]` | All files in project with lock status |
| `['file', fileId]` | Single file content |

---

## Service Communication

### API Gateway (REST)
All REST calls go through the API Gateway. The `axios` instance
automatically attaches the JWT from `authStore`:
```typescript
// Base URL set from VITE_API_URL at build time
axios.defaults.baseURL = import.meta.env.VITE_API_URL

// JWT injected via request interceptor
axios.interceptors.request.use(config => {
  const token = authStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

**Key API calls:**

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Login and receive tokens |
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/refresh` | Refresh access token |
| `GET` | `/workspaces` | List user workspaces |
| `POST` | `/workspaces` | Create workspace |
| `POST` | `/workspaces/:id/members` | Invite member |
| `GET` | `/projects/:id/files` | List files |
| `POST` | `/projects/:id/files/:fileId/lock` | Acquire file lock |
| `DELETE` | `/projects/:id/files/:fileId/lock` | Release file lock |
| `POST` | `/execute` | Submit code for execution |

---

### Collaboration Service (WebSocket)
Direct WebSocket connection — does not go through the API Gateway.
```typescript
// Connection established when user opens a file
const ws = new WebSocket(
  `${import.meta.env.VITE_WS_URL}/collaborate/${fileId}?token=${accessToken}`
)
```

**Message flow:**
```
User types
    │
    ▼
Yjs local update
    │
    ▼
Binary message sent via WebSocket
    │
    ▼
Collaboration Service relays to all other clients
    │
    ▼
Remote Yjs update applied to Monaco Editor
```

**Presence updates sent every 500ms while typing:**
```json
{
  "type": "presence",
  "userId": "uuid",
  "cursor": { "line": 10, "column": 5 },
  "color": "#FF6B6B",
  "name": "Jamal Ishaq"
}
```

---

## File Locking Flow
```
User clicks on a file in FileTree
          │
          ▼
POST /projects/:projectId/files/:fileId/lock
          │
    ┌─────┴──────┐
  200 OK       409 Conflict
    │               │
    ▼               ▼
Editor is       Editor is
read-write      read-only
                    │
                    ▼
            Show lock owner
            and expiry time
```

Lock is renewed automatically every 15 seconds while the file is open.
Lock is released when the user navigates away or closes the file.

---

## Low Level Design

### Folder Structure
```
src/
├── components/
│   ├── features/
│   │   ├── editor/
│   │   │   ├── Editor.tsx           — Monaco Editor wrapper component
│   │   │   ├── EditorToolbar.tsx    — Run button and language selector
│   │   │   ├── ExecutionPanel.tsx   — Code execution output display
│   │   │   ├── PresenceBar.tsx      — Online collaborator avatars
│   │   │   ├── CursorOverlay.tsx    — Remote cursor position rendering
│   │   │   └── editorConfig.ts      — Monaco language and theme configuration
│   │   ├── file-tree/
│   │   │   ├── FileTree.tsx         — File list with lock status indicators
│   │   │   ├── FileTreeItem.tsx     — Single file row with lock badge
│   │   │   └── NewFileDialog.tsx    — Create file modal
│   │   └── workspace/
│   │       ├── WorkspacePanel.tsx   — Sidebar workspace and project navigator
│   │       ├── WorkspaceCard.tsx    — Dashboard workspace summary card
│   │       ├── InviteMemberDialog.tsx — Invite member modal
│   │       └── MemberList.tsx       — Workspace member list with roles
│   └── ui/
│       ├── Button.tsx               — Base button component
│       ├── Input.tsx                — Base input component
│       ├── Modal.tsx                — Base modal wrapper
│       ├── Spinner.tsx              — Loading spinner
│       └── ErrorBoundary.tsx        — React error boundary wrapper
├── pages/
│   ├── LandingPage.tsx              — Public marketing page
│   ├── LoginPage.tsx                — Login form page
│   ├── RegisterPage.tsx             — Registration form page
│   ├── DashboardPage.tsx            — Workspace list page
│   ├── WorkspacePage.tsx            — Projects and members page
│   └── EditorPage.tsx               — Full editor layout page
├── hooks/
│   ├── useCollaboration.ts          — WebSocket connection and Yjs sync
│   ├── useFileLock.ts               — Lock acquire, renew, and release logic
│   ├── useExecution.ts              — Code execution request and result polling
│   └── usePresence.ts               — Presence state from WebSocket messages
├── stores/
│   ├── authStore.ts                 — User session and token state
│   ├── editorStore.ts               — Active file and editor state
│   └── workspaceStore.ts            — Active workspace and project state
├── services/
│   ├── authService.ts               — API calls for login, register, refresh
│   ├── workspaceService.ts          — API calls for workspace and member CRUD
│   ├── fileService.ts               — API calls for file CRUD and lock operations
│   └── executionService.ts          — API calls for code execution
├── utils/
│   └── api-client.ts                — Axios instance with JWT interceptor
├── types/
│   └── index.ts                     — Re-exports from @collabcode/shared-types
├── vite-env.d.ts                    — Vite environment type declarations
└── main.tsx                         — React app entry point and router setup
```

### Hooks
| Name | Description |
|---|---|
| `useCollaboration` | Opens WebSocket to collaboration-service, syncs Yjs doc with Monaco |
| `useFileLock` | Acquires lock on file open, renews every 15s, releases on unmount |
| `useExecution` | Submits code to execution-service, tracks result state |
| `usePresence` | Parses presence messages from WebSocket, returns active user list |

### Services
| Name | Description |
|---|---|
| `AuthService.login` | POST /auth/login, stores tokens in authStore |
| `AuthService.register` | POST /auth/register, stores tokens in authStore |
| `AuthService.refresh` | POST /auth/refresh, updates access token in authStore |
| `AuthService.logout` | POST /auth/logout, clears authStore |
| `WorkspaceService.list` | GET /workspaces, returns workspace array |
| `WorkspaceService.create` | POST /workspaces, creates and returns workspace |
| `WorkspaceService.invite` | POST /workspaces/:id/members, sends invitation |
| `FileService.list` | GET /projects/:id/files, returns files with lock status |
| `FileService.getContent` | GET /projects/:id/files/:fileId, returns file content |
| `FileService.create` | POST /projects/:id/files, creates new file |
| `FileService.acquireLock` | POST /projects/:id/files/:fileId/lock |
| `FileService.releaseLock` | DELETE /projects/:id/files/:fileId/lock |
| `FileService.renewLock` | POST /projects/:id/files/:fileId/lock/renew |
| `ExecutionService.run` | POST /execute, returns execution result |

---

## Environment Variables

All frontend environment variables must be prefixed with `VITE_` —
they are embedded into the JavaScript bundle at build time and are
not secret.

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the API Gateway |
| `VITE_WS_URL` | WebSocket base URL of the collaboration-service |
| `VITE_BUILD_SHA` | Git commit SHA injected at build time for version tracking |

**Never put secrets in VITE_ variables.** They are visible in the
compiled JavaScript bundle to anyone who inspects the source.