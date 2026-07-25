# Admin Panel Pages — Status

## ✅ Fully Wired Pages

> Last updated: 2026-07-25

| Page | Route | Composable | Notes |
|---|---|---|---|
| Login | `/auth/login` | `useAuth` | |
| Register | `/auth/Register` | `useAuth` | |
| Forgot password | `/auth/forgot-password` | `useAuth` | |
| Reset password | `/auth/reset-password` | `useAuth` | |
| Dashboard | `/dashboard` | `useDashboard` | Wired to `GET /api/admin/dashboard` — stat cards + 7-day charts |
| Users | `/users` | `useUsers` | CRUD, pagination, role filter |
| Admins | `/admins` | `useAdmins` | CRUD, pagination |
| Roles | `/roles` | `useRoles` | CRUD + permission assignment |
| Audit | `/audit` | `useAudit` | Filters: date, action, user; model history sub-page |
| Audit model | `/audit/model/[type]/[id]` | `useAudit` | History for specific record |
| Profile | `/profile` | `useAuth` | Needs avatar upload wiring |
| Settings general | `/settings` | `useSettings` | Keys not fully wired |
| Settings features | `/settings/features` | `useSettings` | Feature flag toggles |
| Chat | `/chats` | `useChatManager` | Real-time, functional |
| Notifications | `/notifications` | `useAdminNotifications` | Full page + topbar bell wired |
| Files | `/files` | `useFiles` | Grid/list view, upload, delete, preview (images + PDF) |

## ⬜ Missing Pages

| Page | Why needed |
|---|---|
| `/settings/webhooks` | Outbound webhooks (Phase 4) |

## Known Issues

- `useChat.ts` (old composable) — broken and no longer referenced by ChatWidget. Do not use it.
- `ChatWidget.vue` now delegates entirely to `ChatInterface.vue` via `useChatManager`. The old floating widget UI was removed.
- Pusher credentials still hardcoded in `config/pusher.ts` — should be moved to env/runtimeConfig.

## Components of Note

| Component | Purpose |
|---|---|
| `ChatWidget.vue` | Floating chat button + dialog, uses `useChatManager` |
| `ChatInterface.vue` | Full chat panel with message list + input |
| `NotificationSnackbarSimple.vue` | Toast notifications (included in default layout) |
| `PermissionSelector.vue` | Multi-select permission chip picker (used in roles) |
| `audit/ModelHistory.vue` | Timeline view of audit events for a specific model |
| `charts/*.vue` | ApexCharts wrappers (Area, Bar, Donut, Line, Pie, etc.) |

## Known Issues

- `useChat.ts` (old composable) is broken — uses `$echo` incorrectly. `ChatWidget.vue` may still reference it. **Use `useChatManager.ts` everywhere.**
- `currentChat` global state must be explicitly reset to `null` when the chat dialog closes, otherwise re-opening picks up stale state.
- Pusher credentials hardcoded in `PusherApiService` — should read from `nuxt.config.ts` runtimeConfig.
- Several repository/service types use `id: number` where it should be `id: string` (UUID).
