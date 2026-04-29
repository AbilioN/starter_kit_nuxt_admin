# Nuxt Admin Panel — Agent Prompt
**Created:** 2026-04-29  
**Backend branch:** `system_settings_implementation`  
**Purpose:** Bootstrap the Nuxt admin panel for the BtoB starter kit. This prompt is self-contained — assume zero prior context.

---

## Project Overview

You are building the **admin panel** for a BtoB SaaS backend starter kit.

- **Backend:** Laravel 11 / PHP 8.2, API-only, running at `http://localhost:8006/api`
- **Admin panel:** Nuxt 3 (this repo) — separate from the user-facing Flutter app
- **Auth:** Laravel Sanctum (Bearer token). The admin panel is the ONLY client that talks to `/api/admin/*` routes.
- **Design goal:** Clean, functional admin UI. Prioritize correctness and full API coverage over aesthetics.

---

## Tech Stack Decisions

| Concern | Choice |
|---|---|
| Framework | Nuxt 3 (Vue 3 + Composition API) |
| HTTP client | `$fetch` / `useFetch` with a composable base client |
| Auth state | Pinia store + `useAuth` composable (token in `localStorage` or cookie) |
| UI | Your choice — shadcn-vue, PrimeVue, or Nuxt UI are all reasonable |
| Forms | VeeValidate or native `<form>` + composable |
| Tables | Any headless table or simple `<table>` — pagination is server-side |

---

## Authentication Flow

### Login

```
POST /api/admin/login
Body: { email, password }

Response:
{
  "admin": { "id": 1, "name": "...", "email": "...", "is_super_admin": true },
  "token": "1|abcdef...",
  "roles": ["super-admin"]
}
```

Store the token. Every subsequent request must include:
```
Authorization: Bearer {token}
Accept: application/json
```

### Session check
There is no `/api/admin/me` endpoint. On page load, verify the session by hitting any authenticated endpoint (e.g. `GET /api/admin/dashboard`). A 401 response means the session is expired — redirect to login.

### Logout
Delete the local token. No server-side logout endpoint exists yet.

---

## HTTP Response Conventions

| Situation | Status | Shape |
|---|---|---|
| Successful read/update | 200 | `{ "success": true, "data": ... }` |
| Resource created | 201 | `{ "success": true, "data": ... }` |
| Unauthenticated | 401 | `{ "message": "..." }` |
| Permission denied | 403 | `{ "message": "..." }` |
| Validation error | 422 | `{ "message": "...", "errors": { field: [string] } }` |

Auth endpoints (`/login`, `/register`) return `{ admin, token, roles }` — no `success` key.

---

## Pagination

All list endpoints return:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 50,
    "per_page": 15,
    "current_page": 1,
    "last_page": 4,
    "from": 1,
    "to": 15
  }
}
```

Query params: `?page=1&per_page=15` (per_page validated 1–100 on the backend).

---

## RBAC — Permissions

Every admin has one or more roles. Each role has a set of permissions.  
**Super admins bypass all permission checks.**

Permissions follow the pattern `<resource>-<action>`.

### Full permission list

| Resource | Actions available |
|---|---|
| `admin` | `create`, `read`, `update`, `delete`, `manage` |
| `user` | `create`, `read`, `update`, `delete` |
| `role` | `create`, `read`, `update`, `delete`, `manage`, `assign`, `unassign` |
| `audit` | `read` (only — immutable by design) |
| `setting` | `read`, `update` |
| `file` | `read`, `upload`, `delete` |
| `chat` | `read`, `manage` |

**How to use in the UI:**  
After login, the `roles` array is returned. Fetch the permissions for those roles via `GET /api/admin/permissions` and store them. Gate UI elements (buttons, menu items, pages) based on whether the current admin has the required permission.

Example composable shape:
```ts
const { can } = usePermissions()
can('admin-create') // true/false
```

---

## API Reference — All Endpoints

Base URL: `http://localhost:8006/api`  
All `/admin/*` routes require `Authorization: Bearer {token}` + `admin.auth` middleware.

### Admin Auth (public)
```
POST /admin/login        — { email, password }
POST /admin/register     — { name, email, password, password_confirmation }
```

### Dashboard
```
GET /admin/dashboard     — basic metrics (no specific permission required)
```

### Admins
```
GET    /admin/admins         — list (admin-read) — paginated, ?search=
POST   /admin/admins         — create (admin-create) — { name, email, password, ... }
PUT    /admin/admins         — update (admin-update) — { id, name, ... }
DELETE /admin/admins         — delete (admin-delete) — { id }
```

### Users
```
GET    /admin/users          — list (user-read) — paginated
GET    /admin/users/{id}     — single (user-read)
POST   /admin/users          — create (user-create)
PUT    /admin/users/{id}     — update (user-update)
DELETE /admin/users/{id}     — delete (user-delete)
```

### Roles & Permissions
```
GET  /admin/roles                         — list all roles (role-read)
POST /admin/role/create                   — create role (role-manage)
PUT  /admin/role/update                   — update role (role-manage)
POST /admin/role/delete                   — delete role (role-manage)
POST /admin/role/update-permissions       — sync permissions on role (role-manage)
GET  /admin/permissions                   — list all permissions (no specific permission)
```

### Settings
```
GET /settings/public                     — public settings (NO auth required)
GET /admin/settings                      — list all (setting-read) — ?group=features
GET /admin/settings/{key}                — single setting (setting-read)
PUT /admin/settings/{key}                — update one (setting-update) — { value }
PUT /admin/settings                      — update many (setting-update) — { settings: [{key, value}] }
```

Setting groups: `general`, `features`, `email`, `storage`

Feature flags live in the `features` group (e.g. `features.chat`, `features.ai_agent`). Use the public settings endpoint at app boot to conditionally show/hide feature-gated menu items.

### Notifications (Admin)
```
GET  /admin/notifications                 — list (with ?unread_only=true)
GET  /admin/notifications/unread-count    — { "unread_count": 3 }
POST /admin/notifications/{id}/read       — mark one read
POST /admin/notifications/read-all        — mark all read
```

Notification response shape:
```json
{
  "id": "uuid",
  "type": "WelcomeNotification",
  "data": { "title": "...", "message": "...", "action_url": null },
  "read_at": null,
  "created_at": "2026-04-29 19:00:00"
}
```

### File Management
```
GET    /admin/files           — list (file-read) — ?folder=photos
POST   /admin/files           — upload (file-upload) — multipart/form-data
DELETE /admin/files/{id}      — delete (file-delete)
```

Upload fields:
```
file        required|file|max:102400   (100 MB)
folder      nullable|string            e.g. "photos", "documents"
disk        nullable|in:local,s3       default: local
is_public   nullable|boolean
meta        nullable|array
```

File response shape:
```json
{
  "id": 1,
  "original_name": "photo.jpg",
  "mime_type": "image/jpeg",
  "size": 204800,
  "size_human": "200 KB",
  "folder": "photos",
  "is_public": false,
  "url": "http://localhost:8006/api/files/serve/...",
  "meta": null,
  "created_at": "2026-04-29 19:00:00"
}
```

### Audit Logs (read-only — `audit-read` required)
```
GET /admin/audit                         — list with filters
GET /admin/audit/{id}                    — single log detail
GET /admin/audit/model/{type}/{id}       — history of a specific model
GET /admin/audit/user/{type}/{id}        — activity of a specific user
GET /admin/audit/action/{action}         — filter by action
GET /admin/audit/tag/{tag}              — filter by tag
```

Filter query params: `user_id`, `user_type`, `model_type`, `model_id`, `action`, `tags`, `date_from`, `date_to`

Audit logs are **immutable**. The UI must have NO create/edit/delete affordances for them.

---

## Suggested Page Structure

```
/login                          — public
/dashboard                      — authenticated root
/admins                         — admin list + create/edit/delete (admin-*)
/users                          — user list + CRUD (user-*)
/roles                          — role list + permission management (role-*)
/settings                       — settings editor by group (setting-*)
/settings/features              — feature flag toggles
/notifications                  — notification inbox
/files                          — file browser + uploader (file-*)
/audit                          — audit log viewer (audit-read, read-only)
/audit/:id                      — audit log detail
```

---

## Composable Conventions

### API client
Create `composables/useApi.ts` — a thin wrapper around `$fetch` that:
- Injects `Authorization: Bearer {token}` from the auth store
- Sets `Accept: application/json`
- On 401, clears token and redirects to `/login`
- On 422, surfaces `errors` object to the calling composable

### Auth store (`stores/auth.ts`)
```ts
{
  admin: AdminDto | null
  token: string | null
  roles: string[]
  permissions: string[]   // flat list, populated after login
}
```

### Permission composable (`composables/usePermissions.ts`)
```ts
const { can, isSuper } = usePermissions()
can('admin-create')   // checks permissions array
isSuper()             // checks admin.is_super_admin
```

---

## What NOT to Build Yet

These backend features are planned but not implemented:
- AI Agent integration (Tier 2)
- PDF export (Tier 2)
- 2FA / TOTP (Tier 2)
- Outbound webhooks (Tier 2)
- Module system / install command (Tier 3)
- Multi-tenancy, Billing, Reporting dashboard (post-fork)

Do not add placeholder pages for these — keep the panel clean and only surface what works.

---

## Notes

- The backend uses **Laravel Horizon** for queue management. The Horizon dashboard is at `http://localhost:8006/horizon` (dev only, super admin in production). No need to expose this in the admin panel — it's a separate web UI.
- The `GET /settings/public` endpoint requires no auth and can be called on app boot to get `app.name`, timezone, and feature flags without blocking the login page.
- File soft-deletes are in place — a deleted file disappears from the list but is logged in audit.
- Notification IDs are UUIDs. File IDs are integers.
- All admin routes require both `auth:sanctum` (Sanctum token) and the `admin.auth` middleware (checks `is_active` flag). A deactivated admin gets a 403 even with a valid token.
