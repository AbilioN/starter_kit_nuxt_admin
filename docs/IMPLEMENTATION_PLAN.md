# Admin Panel — Implementation Plan
**Created:** 2026-04-29  
**Stack:** Nuxt 3 · Vuetify 3 · Pinia · $fetch  
**Backend:** Laravel 11 at `http://localhost:8006/api`

---

## Current State

### Done
- [x] Auth flow — login, logout, token persistence (`localStorage`)
- [x] `useAuth` composable + `AuthService`
- [x] `usePermissions` composable (roles, permissions, super-admin bypass)
- [x] `ApiClient` (`infrastructure/http/ApiClient.ts`) — Bearer token injection
- [x] `middleware/auth.ts` — route guard (unauthenticated → `/auth/login`)
- [x] `/auth/Login` and `/auth/Register` pages
- [x] Dashboard page (`/dashboard`) — hardcoded placeholder data
- [x] Users page (`/users`) — list + pagination wired, CRUD dialogs **stubbed**
- [x] Admins page (`/admins`) — needs verification
- [x] Roles page (`/roles`) — roles + permission matrix
- [x] Audit list page (`/audit`) — read-only list with filters
- [x] Audit model history component (`components/audit/ModelHistory.vue`)
- [x] Notification system — real-time (Pusher/Echo) + snackbar toasts
- [x] Chat system — `useChat`, `ChatInterface`, `ChatWidget`
- [x] Sidebar with permission-gated nav items
- [x] Vuetify 3 theme + SCSS customizations

---

## Known Bugs / Tech Debt

- [x] **`useAuth` logout key mismatch** — fixed: `localStorage.removeItem('auth_token')`.
- [x] **`ApiClient` missing 401 handler** — fixed: clears token and redirects to `/auth/login` on 401.
- [x] **`can()` alias missing** — fixed: added `can` as alias for `hasPermission` in `usePermissions`.
- [ ] **Dashboard uses hardcoded data** — should call `GET /api/admin/dashboard` for real metrics.
- [ ] **Users CRUD dialogs are stubs** — create, edit, delete are wired to no-op handlers. Needs real API calls via `useUsers`.
- [ ] **Admins CRUD** — verify same situation.
- [ ] **`audit/[id].vue` detail page missing** — sidebar links to `/audit` but the spec requires a detail view at `/audit/:id`.

---

## Backlog — Features to Build

### Phase 1 — Settings ✅ Done

- [x] `types/api.d.ts` — add `Setting`, `SettingGroup` types
- [x] `services/SettingsService.ts` — CRUD + bulk update + public settings
- [x] `composables/useSettings.ts` — reactive state, grouped settings, feature flags, `isFeatureEnabled()`
- [x] `pages/settings/index.vue` — tabbed editor by group (`general`, `email`, `storage`, `features`)
- [x] `pages/settings/features.vue` — dedicated feature flag toggle page (auto-saves on toggle)
- [x] Sidebar entry for Settings + Feature Flags (requires `setting-read` permission)
- [x] Sidebar entry for Notifications (no permission required)
- [x] `plugins/publicSettings.client.ts` — calls `GET /settings/public` at app boot
- [x] `config/api.ts` — added `PUBLIC_BASE_URL` for non-admin endpoints

### Phase 2 — File Management

- [ ] `types/api.d.ts` — add `AdminFile` type
- [ ] `services/FileService.ts` — list, upload (multipart), delete
- [ ] `composables/useFiles.ts` — reactive list, upload progress, pagination, folder filter
- [ ] `pages/files/index.vue` — grid/table view, folder filter, upload button, delete with confirm
- [ ] Upload component — drag-and-drop area, `disk` + `folder` + `is_public` fields, progress bar
- [ ] Sidebar entry for Files (requires `file-read` permission)

### Phase 3 — Notifications Inbox

- [ ] `pages/notifications/index.vue` — full inbox list (paginated, unread filter)
- [ ] Mark single / mark all as read actions
- [ ] Unread badge on sidebar notification link (already has real-time count via Pusher — just needs the page)
- [ ] Sidebar entry for Notifications (no specific permission required)

### Phase 4 — Completing Existing Pages

- [ ] `pages/audit/[id].vue` — detail view for a single audit log
- [ ] Wire Users create dialog → `POST /admin/users`
- [ ] Wire Users edit dialog → `PUT /admin/users/{id}`
- [ ] Wire Users delete confirm → `DELETE /admin/users/{id}`
- [ ] Wire Admins CRUD (same pattern as Users)
- [ ] Connect Dashboard stats to `GET /admin/dashboard` response

### Phase 5 — Polish

- [ ] `middleware/permissions.ts` — page-level permission guard (currently unused)
- [ ] Global 403 / 404 error pages
- [ ] Empty-state components for all list pages
- [ ] Loading skeletons instead of spinner for tables
- [ ] Confirm the sidebar hides/shows items based on feature flags from public settings

---

## API Endpoints — Implementation Status

| Endpoint | Composable | Page | Status |
|---|---|---|---|
| `POST /admin/login` | `useAuth` | `/auth/login` | ✅ Done |
| `GET /admin/dashboard` | — | `/dashboard` | ⚠️ Hardcoded |
| `GET /admin/admins` | `useAdmins` | `/admins` | ⚠️ List only |
| `POST/PUT/DELETE /admin/admins` | `useAdmins` | `/admins` | ⚠️ Stub |
| `GET /admin/users` | `useUsers` | `/users` | ⚠️ List only |
| `POST/PUT/DELETE /admin/users/{id}` | `useUsers` | `/users` | ⚠️ Stub |
| `GET /admin/roles` | `useRoles` | `/roles` | ✅ Done |
| `POST/PUT /admin/role/*` | `useRoles` | `/roles` | ✅ Done |
| `GET /admin/permissions` | `useAvailablePermissions` | `/roles` | ✅ Done |
| `GET/PUT /admin/settings` | `useSettings` | `/settings` | ✅ Done |
| `GET /settings/public` | `useSettings` | app boot plugin | ✅ Done |
| `GET /admin/files` | — | — | ❌ Missing |
| `POST/DELETE /admin/files` | — | — | ❌ Missing |
| `GET /admin/notifications` | `useNotification` | — | ❌ No page |
| `POST /admin/notifications/*/read` | `useNotification` | — | ❌ No page |
| `GET /admin/audit` | `useAudit` | `/audit` | ✅ Done |
| `GET /admin/audit/{id}` | `useAudit` | — | ❌ No page |

---

## Implementation Order

```
Phase 1: Settings + Feature Flags   ← starting now
Phase 2: File Management
Phase 3: Notifications Inbox
Phase 4: Complete CRUD on Users/Admins + Audit detail
Phase 5: Polish + guards
```

---

## Conventions to Follow

- Pages use `definePageMeta({ middleware: 'auth' })`.
- All API calls go through `ApiClient` (Bearer token auto-injected).
- Composables use `useState` for shared reactive state across components.
- `usePermissions().hasPermission('x-y')` gates buttons/actions; sidebar items use the `permission` field on `sidebarItem`.
- Destructive actions (delete) always show a confirm dialog before calling the API.
- Server-side pagination: always pass `?page=` and `?per_page=` — never load all records.
- No placeholder pages for unimplemented backend features (AI Agent, 2FA, etc.).
