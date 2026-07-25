# Admin Panel Architecture (Nuxt 3)

## Stack
- Nuxt 3 (SPA — `ssr: false`)
- Vue 3 + TypeScript
- Vuetify 3 (UI components)
- Laravel Echo + Pusher JS (real-time)
- Custom HTTP layer (no axios/fetch wrapper library)

## Layer Stack

```
pages/          ← routes (file-based routing), use composables
composables/    ← view-model: state + loading + pagination + calls services
services/       ← orchestration, shape normalisation, error handling
infrastructure/
  repositories/ ← REST endpoint definitions, calls ApiClient
  http/
    ApiClient.ts ← base fetch with auth header, timeout, baseURL
```

Data flows **down** (page → composable → service → repo → ApiClient) and back up as return values. Never call repos directly from pages.

## Key Files

| File | Purpose |
|---|---|
| `nuxt.config.ts` | SPA mode, Vuetify transpile, Pusher runtimeConfig |
| `plugins/vuetify.ts` | Vuetify theme and icons |
| `plugins/echo.client.ts` | Laravel Echo + Pusher initialisation |
| `infrastructure/http/ApiClient.ts` | Base HTTP client — reads token from `localStorage['auth_token']` |
| `config/api.ts` | `BASE_URL = 'http://localhost:8006/api'` |
| `config/pusher.ts` | Pusher credentials (should move to env) |
| `composables/useAuth.ts` | Login, logout, `checkAuth()`, current admin state |
| `composables/usePermissions.ts` | `can('slug')`, `isSuperAdmin`, permission list |
| `middleware/auth.ts` | Redirects to login if no session |
| `middleware/permissions.ts` | Per-route permission guard (`routePermissions` map) |
| `components/Layout/Full/vertical-sidebar/sidebarItem.ts` | Nav items with `permission?: string` |

## Auth Flow

1. `POST /api/admin/login` → `{ admin, token, roles, channel }`
2. Token saved to `localStorage['auth_token']`
3. Admin + roles saved in `useState('auth')` global state
4. `usePermissions` reads permissions from roles and exposes `can('slug')`
5. On every page load: `middleware/auth.ts` calls `checkAuth()` — validates token still works

## Real-Time (Echo / Pusher)

```ts
// in composables, after login:
const echo = useNuxtApp().$echo
echo.private(`user.admin.${adminId}`)
  .listen('.MessageSent', handler)
  .listen('.MessageEdited', handler)
  .listen('.MessageDeleted', handler)
```

Typing indicators:
```ts
// trigger (client event — no server needed):
echo.private(`chat.${chatId}`).whisper('typing', { name })

// listen:
echo.private(`chat.${chatId}`).listenForWhisper('typing', handler)
```

## State Management

Only `useState()` from Nuxt — no Pinia, no Vuex. Global states:
- `useState('auth')` — current admin + token + roles
- `useState('permissions')` — flat permission slug array
- `useState('currentChat')` — active chat in ChatWidget (must be reset on dialog close)

## RBAC in the UI

```ts
// composable
const { can, isSuperAdmin } = usePermissions()

// template
<v-btn v-if="can('user-create')">Add User</v-btn>

// page meta (route-level guard)
definePageMeta({ middleware: ['auth', 'permissions'] })
```

## Adding a New Page — Checklist

1. Create `pages/<section>/index.vue`
2. Add `definePageMeta({ middleware: 'auth' })` + permissions guard if needed
3. Add nav item to `sidebarItem.ts` with `permission` field
4. Add route to `middleware/permissions.ts` `routePermissions` map
5. Create `composables/use<Section>.ts` (loading, pagination, data)
6. Create `services/<Section>Service.ts` if complex logic
7. Create `infrastructure/repositories/<Section>Repository.ts`
