# Nuxt Admin Panel — Multitenancy Adaptation Prompt
**Created:** 2026-08-03 · **Updated:** 2026-08-06
**Backend branch:** `dev` (through `feat: tenant branding — logo upload, color palette, GodAdmin + tenant-owner self-service`)
**Purpose:** Adapt this Nuxt admin panel to the backend's new database-per-tenant multitenancy. This prompt is self-contained — assume zero prior context beyond this repo's existing `docs/2026-04-29_ADMIN_PANEL_PROMPT.md` and `docs/API_ENDPOINTS.md`.

> **2026-08-04 update:** the subdomain-based approach below (`utils/tenant.ts`, `config/api.ts`) is already implemented, but hits a real blocker in the browser — see **"Known issue: subdomain hostnames don't resolve"** partway through. Read that section before touching tenant resolution further; it changes what `buildTenantApiOrigin` should actually do.

> **2026-08-06 update:** the branding endpoints below are no longer just planned — they're implemented and verified end-to-end against the real backend (logo file upload, hex color palette, settable both by GodAdmin at tenant-creation time and by the tenant owner via self-service). The **"New: public tenant branding endpoint"** and **"New: `is_tenant_owner` on Admin"** sections were rewritten with the final, tested contract — re-read them even if you already skimmed this doc before, the request shape changed (multipart, not JSON-only) and the response now includes a ready-to-use `logo_url`.

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
GET /api/tenant/theme   (no auth required, still needs the tenant resolved — subdomain or ?tenant=)

Response:
{
  "success": true,
  "data": {
    "name": "Tenant A",
    "primary_color": "#112233" | null,
    "secondary_color": "#445566" | null,
    "logo_url": "http://localhost:8006/storage/tenant-logos/xxx.png" | null
  }
}
```

Branding can now be set from **two independent places** on the backend — GodAdmin sets it (optionally) when creating the tenant, and/or the tenant owner edits it later from their own admin panel. Whichever was saved most recently is what this endpoint returns — there's no "GodAdmin wins" precedence, it's just whatever the `tenants` row currently holds. Either color can be `null` (tenant never set one) — fall back to the app's default palette/logo in that case, don't treat `null` as an error.

**This read side is already fully implemented** in `composables/useTenantTheme.ts` — don't rebuild it, the bullets below just describe what it already does (useful if you need to verify it's still correct, or extend it):

**Where it's called and how it's applied:**
- Call it once on app boot, **before** the login page renders (it's public specifically so branding shows pre-auth) — e.g. a Nuxt plugin (`plugins/tenant-theme.client.ts`) or a composable called from `app.vue`'s `setup()`, run alongside/after the existing tenant-resolution logic in `utils/tenant.ts` since this call needs the same `?tenant=` query param appended in query mode (reuse `appendTenantQueryParam` + `getTenantQueryParam` from there, same as every other repository does).
- Apply the colors to Vuetify's theme **at runtime**, not just at build time — Vuetify 3's `useTheme()` composable supports this directly:
  ```ts
  const theme = useTheme();
  if (data.primary_color) theme.themes.value.light.colors.primary = data.primary_color;
  if (data.secondary_color) theme.themes.value.light.colors.secondary = data.secondary_color;
  // repeat for .dark if this app's Vuetify config defines a dark theme
  ```
- Store the resolved branding (`name`, `primary_color`, `secondary_color`, `logo_url`) in shared reactive state, e.g. `useState<TenantTheme | null>('tenantTheme', () => null)`, and use `logo_url` wherever the app currently hardcodes a static logo image (login page, sidebar/header brand mark) — `<img :src="tenantTheme?.logo_url ?? defaultLogo">`.

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

This is a **different concept from `is_super_admin`** (which is an RBAC bypass, unrelated to tenancy) — `is_tenant_owner` marks the admin who owns the tenant's subscription/billing and branding settings. It is not a permission-system flag; the backend gates the two endpoints below by this boolean directly, not via `roles`/`permissions`. It's present on both the login response's `admin` object and `GET /api/admin/me` — gate the "Branding" UI on `useAuth().user.value?.is_tenant_owner === true` (or `admin?.me`'s equivalent field, same name), not on a role/permission check.

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
Content-Type: multipart/form-data — this is a file upload, NOT plain JSON.

Fields (all optional, send only what changed):
  theme_primary_color   string   "#rrggbb"
  theme_secondary_color string   "#rrggbb"
  logo                  file     image, max 2MB — takes precedence over logo_path if both sent
  logo_path             string   only if you already have a hosted path and just want to reassign it (rare — normally you'll send `logo` instead)

Response:
{
  "success": true,
  "data": {
    "theme_primary_color": "#rrggbb" | null,
    "theme_secondary_color": "#rrggbb" | null,
    "logo_path": "tenant-logos/xxx.png" | null,
    "logo_url": "http://localhost:8006/storage/tenant-logos/xxx.png" | null   // ready to use directly, no extra fetch needed
  }
}
```

**Important — PHP/Laravel doesn't parse multipart bodies on native PATCH requests.** Send this as a real `POST` with a spoofed method field instead (standard Laravel convention, already verified working against this exact endpoint):

```ts
const formData = new FormData();
formData.append('_method', 'PATCH');
if (primaryColor) formData.append('theme_primary_color', primaryColor);
if (secondaryColor) formData.append('theme_secondary_color', secondaryColor);
if (logoFile) formData.append('logo', logoFile);

// fetch(url, { method: 'POST', body: formData, headers: { Authorization: `Bearer ${token}` } })
// — do NOT set Content-Type manually; the browser sets the multipart boundary for you.
```

### This UI already exists — it has one real bug, fix it rather than rebuilding

Don't build a new branding page. It's already there and mostly correct:
`composables/useTenantTheme.ts` (reads + applies colors to Vuetify at runtime via `useTheme()`, already handles the pre-auth public fetch, already stores the shared `tenantTheme` state — all of that matches the guidance above because it was already built to spec), `composables/useTenantSettings.ts` (the tenant-owner write side), `services/TenantService.ts` + `infrastructure/repositories/TenantRepository.ts` (the HTTP layer), and the actual form UI at `pages/settings/index.vue` (a "Branding & Plan" tab, gated on `admin.value?.is_tenant_owner`, exactly as this doc used to suggest).

**The one thing that's wrong:** `pages/settings/index.vue`'s `saveBranding()` (around line 62) uploads the chosen logo file through the *generic* `useFiles().uploadFile()` composable — which hits the private `/files` endpoint (permission-gated, private disk, returns a `files`-table row UUID) — and then sends that UUID as `logo_path`:

```ts
// pages/settings/index.vue — current, incorrect
const uploaded = await uploadFile(logoFile.value, 'branding');
logo_path = uploaded?.id;   // this UUID doesn't correspond to any storage path the branding endpoint understands
```

The comment already in that file even flags this as a stopgap ("the file's id is the closest match this app's File API currently exposes"). It isn't a match at all: `logo_path` on the branding endpoint must be a relative path like `tenant-logos/xxx.png` under the **public** disk, not a private-file UUID — `GET /api/tenant/theme`'s `logo_url` would end up pointing at a URL that 404s. **This is exactly why `PATCH /api/admin/tenant/branding` now also accepts the raw file directly as a `logo` multipart field (see contract above)** — skip the intermediate `/files` upload entirely.

**Fix, three files:**

1. `types/api.d.ts` — add to `UpdateTenantBrandingRequest`:
   ```ts
   export interface UpdateTenantBrandingRequest {
     theme_primary_color?: string;
     theme_secondary_color?: string;
     logo?: File;        // NEW — send the raw File, not a path
     logo_path?: string; // keep for the rare case of reassigning an already-hosted path
   }
   ```
   and add `logo_url: string | null;` to `TenantBranding` (the backend response already includes it, the type just doesn't reflect that yet).

2. `infrastructure/repositories/TenantRepository.ts` — `updateBranding()` currently does `this.apiClient.patch(ENDPOINT, data)`, which JSON-encodes the body (`ApiClient.request()` always sets `Content-Type: application/json` and `JSON.stringify`s — see `infrastructure/http/ApiClient.ts`). That can't carry a `File`. Replace it with a raw `fetch` + `FormData` + `_method=PATCH` spoofing, the same shape `FileRepository.ts`'s `uploadFile()` already uses for the `/files` endpoint (reuse its `appendTenantQueryParam(...)` + `localStorage.getItem('auth_token')` pattern):
   ```ts
   async updateBranding(data: UpdateTenantBrandingRequest): Promise<TenantBranding> {
     const token = process.client ? localStorage.getItem('auth_token') : null;
     const formData = new FormData();
     formData.append('_method', 'PATCH');
     if (data.theme_primary_color) formData.append('theme_primary_color', data.theme_primary_color);
     if (data.theme_secondary_color) formData.append('theme_secondary_color', data.theme_secondary_color);
     if (data.logo) formData.append('logo', data.logo);
     else if (data.logo_path) formData.append('logo_path', data.logo_path);

     const url = appendTenantQueryParam(`${this.baseURL}${API_CONFIG.ENDPOINTS.TENANT_BRANDING}`, this.tenantQueryParam);
     const res = await fetch(url, {
       method: 'POST',
       headers: { Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' },
       body: formData,
     });
     if (!res.ok) {
       const body = await res.json().catch(() => ({})) as { message?: string };
       throw new Error(body.message ?? `Branding update failed: ${res.status}`);
     }
     const json = await res.json() as UpdateTenantBrandingResponse;
     return json.data;
   }
   ```
   (`this.baseURL` / `this.tenantQueryParam` don't exist on this class yet — add them the same way `FileRepository.ts` does, from `getApiConfig()`.)

3. `pages/settings/index.vue` — delete the `useFiles()`/`uploadFile()` detour in `saveBranding()` entirely, pass the file straight through:
   ```ts
   const saveBranding = async () => {
     const ok = await updateBranding({
       theme_primary_color: brandingForm.theme_primary_color || undefined,
       theme_secondary_color: brandingForm.theme_secondary_color || undefined,
       logo: logoFile.value ?? undefined,
     });
     if (ok) logoFile.value = null;
   };
   ```
   The `useFiles` import/destructure (`const { uploadFile, uploading: logoUploading } = useFiles();`) can go too if nothing else on the page uses it — check first.

`useTenantSettings.updateBranding()` already calls `loadTenantTheme(true)` after a successful save to re-fetch and re-apply the fresh branding — that's a fine pattern, no need to change it just because the PATCH response also happens to include `logo_url` now.

There's no `SubscriptionPlan` list endpoint exposed to tenant admins yet (only GodAdmin can list/create plans in its own Livewire UI) — the "Subscription plan" half of that same settings tab is a raw id field for now per its own comment; that's a known, separate gap, not something introduced by this change.

**Heads up on GodAdmin:** GodAdmin can now also set a tenant's logo/colors at creation time (and edit them later from the tenant's detail page in its own Livewire UI) — this doesn't require anything from you, it's mentioned so you understand why a freshly-provisioned tenant might already show non-default branding the very first time its owner logs in. Whichever side (GodAdmin or the tenant owner) saved most recently is what `GET /api/tenant/theme` returns.

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

For the branding fix specifically, verify the backend contract directly first (isolates backend from frontend, same reasoning as above), then confirm the same thing works through the actual Settings UI:

```bash
TOKEN=$(curl -s "http://localhost:8006/api/admin/login?tenant=tenant-a" \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"email":"admina@tenant-a.test","password":"password123"}' | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')

curl -X POST "http://localhost:8006/api/admin/tenant/branding?tenant=tenant-a" \
  -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
  -F "_method=PATCH" -F "theme_primary_color=#FF5733" -F "logo=@/path/to/any.png"
# -> 200, { success: true, data: { theme_primary_color, theme_secondary_color, logo_path, logo_url } }
# logo_url should point at a real file — curl it directly, expect a 200 with an image content-type, not a 404
```

Then in the browser: log in as `admina@tenant-a.test`, open Settings → Branding & Plan, upload a logo + pick colors, save, and confirm the sidebar/login-page logo actually updates — not just that the request returns 200.
