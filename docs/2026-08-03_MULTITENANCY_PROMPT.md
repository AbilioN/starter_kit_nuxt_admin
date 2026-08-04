# Nuxt Admin Panel — Multitenancy Adaptation Prompt
**Created:** 2026-08-03 · **Updated:** 2026-08-04
**Backend branch:** `dev` (through `feat: add ?tenant= query param fallback for local dev without DNS setup`)
**Purpose:** Adapt this Nuxt admin panel to the backend's new database-per-tenant multitenancy. This prompt is self-contained — assume zero prior context beyond this repo's existing `docs/2026-04-29_ADMIN_PANEL_PROMPT.md` and `docs/API_ENDPOINTS.md`.

> **2026-08-04 update:** the subdomain-based approach below (`utils/tenant.ts`, `config/api.ts`) is already implemented, but hits a real blocker in the browser — see **"Known issue: subdomain hostnames don't resolve"** partway through. Read that section before touching tenant resolution further; it changes what `buildTenantApiOrigin` should actually do.

---

## What changed and why

The backend (`starter_kit_backend`) went from single-tenant to **database-per-tenant multitenancy**. Every Admin/User record now lives inside a tenant-specific MySQL database, resolved per-request from the request's **subdomain** (e.g. `tenant-a.starterkit.test`) by a Laravel middleware called `IdentifyTenant`. A new platform-operator actor, **GodAdmin**, sits above tenants (creates them, defines subscription plans) — but GodAdmin is a **separate Laravel + Livewire app** at `/god/*`, session-authenticated, with its own Blade views. It is **not** part of this Nuxt app and never will be — don't build any GodAdmin UI here.

Full design: `starter_kit_backend/docs/03-multitenancy-plan.md`. Local dev subdomain setup: `starter_kit_backend/docs/04-local-dev-tenants.md`.

---

## The one change that affects everything: API calls now require a tenant subdomain

**Before:** this app talked to a single fixed backend at `http://localhost:8006/api`.

**Now:** that fixed URL no longer resolves any tenant-scoped route. Every route in `routes/api.php` (which is everything this app calls — `/login`, `/admin/*`, `/chat/*`, `/user/*`) is wrapped in `tenant.identify` middleware, which extracts the subdomain from the request `Host` header and looks up the matching tenant. Hitting the API via plain `localhost:8006` (no tenant subdomain) now returns `404 { "message": "Tenant not found." }` for literally every endpoint except the two public ones listed below.

**What this means concretely:**
- `config/api.ts`'s hardcoded `BASE_URL: 'http://localhost:8006/api/admin'` / `PUBLIC_BASE_URL: 'http://localhost:8006/api'` need to become tenant-aware — the host portion must include the tenant's subdomain.
- This app needs a concept of "which tenant am I currently pointed at" that didn't exist before. How you resolve that is a design decision for you to make (see options below) — there's no existing pattern in this codebase to follow since this is genuinely new.

**Local dev tenants that already exist and work right now** (provisioned against the real running backend, not just tests):

| Tenant | Subdomain | Admin email | Password | `is_tenant_owner` |
|---|---|---|---|---|
| Tenant A | `tenant-a` | `admina@tenant-a.test` | `password123` | `true` |
| Tenant B | `tenant-b` | `adminb@tenant-b.test` | `password123` | `true` |

Both admins also have `is_super_admin: true` (full RBAC bypass — normal for a tenant's first/owner admin). Backend runs at `http://localhost:8006` per the existing Docker setup; you need `/etc/hosts` entries or `*.127.0.0.1.nip.io` for the subdomains to resolve locally (see `starter_kit_backend/docs/04-local-dev-tenants.md` for exact steps) — same requirement as accessing the backend directly.

**Status (2026-08-04): the runtime tenant switcher is already built.** `utils/tenant.ts` (`getTenantSubdomain()` + `buildTenantApiOrigin()`) reads the tenant from `window.location.hostname`, with a `?tenant=xyz` dev override (remembered in `localStorage`) for when the app itself isn't served from a real tenant subdomain. `config/api.ts`'s `getApiConfig()` calls `buildTenantApiOrigin()` to build the API origin. That part of the design decision is made — don't redo it or introduce a second mechanism.

### Known issue: subdomain hostnames don't resolve

`buildTenantApiOrigin()` always builds the API origin as `http://{tenant}.{rootDomain}` (e.g. `http://tenant-a.starterkit.test:8006`) — a real subdomain prefix on the *API's* host, regardless of how the tenant was resolved. That hostname isn't in DNS anywhere and nothing in this stack teaches the browser to resolve it (no `/etc/hosts`, no wildcard DNS configured on most dev machines) — so every request fails at the network layer (`Failed to fetch`) before it even reaches the backend. This is true even when `getTenantSubdomain()` correctly resolves `tenant-a` via the `?tenant=` dev override on the *app's own* URL — the resolved tenant name still gets prefixed onto an unresolvable API hostname.

**The fix, now available:** the backend's `IdentifyTenant` middleware (as of `dev`) accepts a `?tenant=<subdomain>` query param on the *API request itself* as a fallback when the Host header doesn't resolve to a tenant — but **only when `APP_ENV` is `local` or `testing`** on the backend (never staging/production; letting a query param override subdomain-based tenant resolution there would defeat the whole point of subdomain isolation). Verify it directly:

```bash
curl "http://localhost:8006/api/admin/login?tenant=tenant-a" \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"email":"admina@tenant-a.test","password":"password123"}'
# -> 200 with a real Sanctum token
```

Adjust `buildTenantApiOrigin()` (or `getApiConfig()`) so that, for local dev, it builds the origin **without** the tenant subdomain prefix (just `http://localhost:8006`, i.e. `rootDomain` alone) and instead have `ApiClient` append `?tenant={tenant}` as a query param to every request (`infrastructure/http/ApiClient.ts`'s `request()` method is the one place to do this — it already builds `fullURL` from `baseURL` + `url`, so append the param there rather than in each repository). Keep the subdomain-prefixed behavior available behind an env flag (e.g. only skip the prefix when `NUXT_PUBLIC_TENANT_MODE=query` or similar) so the "real" subdomain-based path — the one that actually matches production — doesn't get deleted, just isn't the default until `/etc/hosts`/wildcard DNS is set up.

This needs to stay consistent across every repository in `infrastructure/repositories/` (`AuthRepository.ts`, `AdminRepository.ts`, `ChatRepository.ts`, `FileRepository.ts`, `AuditRepository.ts` — they all construct their own `new ApiClient()` internally, but since the fix belongs in `ApiClient`/`buildTenantApiOrigin` itself, none of those repository files need to change individually).

`starter_kit_backend/docs/04-local-dev-tenants.md` documents all three tenant-resolution options for local dev (`/etc/hosts`, `nip.io`, and this query param) if you need the full picture.

---

## New: public tenant branding endpoint

```
GET /api/tenant/theme   (no auth required, still needs the tenant subdomain resolved)

Response:
{
  "success": true,
  "data": {
    "name": "Tenant A",
    "primary_color": "#112233",
    "secondary_color": "#445566",
    "logo_url": "http://.../storage/..." | null
  }
}
```

Call this before rendering the login page (`pages/auth/Login.vue`) so branding (colors/logo) shows even pre-auth — this is the reason the endpoint is public. There's no existing frontend code for this; you're adding it from scratch. A reasonable place is a new composable (e.g. `useTenantTheme.ts`, sibling to the existing `composables/useAuth.ts`) called from the login page's `setup()`/`onMounted`, applying `primary_color`/`secondary_color` to CSS variables or Vuetify's theme config.

---

## New: `is_tenant_owner` on Admin

The `Admin` type in `types/api.d.ts` is missing this field — add it:

```ts
export interface Admin {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_super_admin: boolean;
  is_tenant_owner: boolean; // NEW
  last_login_at: string | null;
  channel?: string;
}
```

This is a **different concept from `is_super_admin`** (which is an RBAC bypass, unrelated to tenancy) — `is_tenant_owner` marks the admin who owns the tenant's subscription/billing and branding settings. It is not a permission-system flag; the backend gates the two endpoints below by this boolean directly, not via `roles`/`permissions`.

### Two new tenant-owner-only endpoints

```
PATCH /api/admin/tenant/subscription-plan
Auth: Bearer token, admin must have is_tenant_owner = true (403 otherwise)
Body: { "subscription_plan_id": "<uuid>" }
Response: { "success": true }
```

```
PATCH /api/admin/tenant/branding
Auth: Bearer token, admin must have is_tenant_owner = true (403 otherwise)
Body: { "theme_primary_color"?: "#rrggbb", "theme_secondary_color"?: "#rrggbb", "logo_path"?: string }
Response: { "success": true, "data": { "theme_primary_color", "theme_secondary_color", "logo_path" } }
```

There's no `SubscriptionPlan` list endpoint exposed to tenant admins yet (only GodAdmin can list/create plans in its own Livewire UI) — if the UI needs to show plan options here, that's an open gap to flag back to the backend, not something to work around on the frontend.

Suggested UI: a section inside the existing `pages/settings/` (visible only `v-if="admin.is_tenant_owner"`) for branding (color pickers + logo upload) and subscription plan display/change — no tenant-specific settings page exists there yet, follow whatever pattern the rest of `pages/settings/` already uses for form submission + validation error display (422 responses shaped as `{ message, errors: { field: [string] } }`, same convention as everything else per `docs/2026-04-29_ADMIN_PANEL_PROMPT.md`).

---

## Explicitly out of scope

- **GodAdmin UI** — separate Livewire app at `starter_kit_backend`'s `/god/*`, session-auth, not Sanctum, not reachable from this Nuxt app. Don't build tenant-creation or subscription-plan-management screens here; that's GodAdmin's job.
- **`lets_jam_app` (Flutter)** — untouched this phase, stays single-tenant, not your concern.
- **Self-service tenant signup UI** — the backend has a `POST /signup` endpoint (Blade-rendered, not JSON API, served outside any tenant context) for this; it's intentionally not a Nuxt page.

---

## Verification

Confirm end-to-end against the real local backend (not just against mocks) — pick whichever curl matches the resolution mode you're actually using:

```bash
# query-param mode (works with zero DNS setup, matches the fix above)
curl "http://localhost:8006/api/admin/login?tenant=tenant-a" \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"email":"admina@tenant-a.test","password":"password123"}'

# subdomain mode (needs /etc/hosts or nip.io first - see
# starter_kit_backend/docs/04-local-dev-tenants.md)
curl -X POST http://tenant-a.starterkit.test:8006/api/admin/login \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"email":"admina@tenant-a.test","password":"password123"}'
```

Either should return a 200 with a real Sanctum token. Then log in through the actual UI (not just curl) and confirm the dashboard loads — don't trust that the code compiles as proof it works; `Failed to fetch` in the browser console is exactly the kind of failure that only shows up when you actually click through it.
