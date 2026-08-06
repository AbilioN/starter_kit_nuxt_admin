// Multitenancy: this admin panel is expected to run on a tenant subdomain
// (e.g. tenant-a.admin.example.com or tenant-a.localhost:3000 in dev) and
// mirrors that same subdomain onto the API host, matching the backend's
// subdomain-based tenant resolution (IdentifyTenant middleware).

const RESERVED_HOSTS = new Set(['localhost']);

// Dev convenience: when the app isn't served from a real tenant subdomain
// (plain localhost, no /etc/hosts or nip.io setup), switch tenants with
// ?tenant=xyz instead — no DNS involved. It's remembered in localStorage so
// it survives navigation until you set a different one.
const DEV_TENANT_STORAGE_KEY = 'dev_tenant_override';

/**
 * Reads the current browser hostname and returns its first label as the
 * tenant subdomain, e.g. "tenant-a.starterkit.test" -> "tenant-a".
 * Falls back to the ?tenant= dev override (see DEV_TENANT_STORAGE_KEY) when
 * the host carries no real subdomain — callers should fall back further to
 * NUXT_PUBLIC_DEFAULT_TENANT if this still returns null.
 */
export const getTenantSubdomain = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const hostname = window.location.hostname;
  const labels = hostname.split('.');
  const firstLabel = labels[0] ?? '';
  const isIpOctet = /^\d+$/.test(firstLabel);
  const hasRealSubdomain = labels.length >= 2 && !RESERVED_HOSTS.has(firstLabel) && !isIpOctet;

  if (hasRealSubdomain) {
    return firstLabel;
  }

  const queryTenant = new URLSearchParams(window.location.search).get('tenant');
  if (queryTenant) {
    window.localStorage.setItem(DEV_TENANT_STORAGE_KEY, queryTenant);
    return queryTenant;
  }

  return window.localStorage.getItem(DEV_TENANT_STORAGE_KEY);
};

// The resolved tenant is always attached to the API as either a subdomain
// prefix on the host ("subdomain" — what production actually uses) or a
// ?tenant= query param on each request ("query" — a local-dev-only fallback
// the backend's IdentifyTenant middleware accepts when APP_ENV is local/testing,
// for machines with no /etc/hosts or wildcard DNS set up). Never defaults to
// "query" — that has to be opted into per environment.
export type TenantMode = 'subdomain' | 'query';

export const getTenantMode = (): TenantMode =>
  useRuntimeConfig().public.tenantMode === 'query' ? 'query' : 'subdomain';

const resolveTenant = (): string | null =>
  getTenantSubdomain() || useRuntimeConfig().public.defaultTenant || null;

/**
 * Builds the origin (protocol + host) of the tenant-scoped API.
 * - "subdomain" mode (default, matches production): prefixes the resolved
 *   tenant onto rootDomain, e.g. "starterkit.test:8006" ->
 *   "http://tenant-a.starterkit.test:8006".
 * - "query" mode: returns rootDomain as-is — the tenant travels as a
 *   ?tenant= query param instead (see appendTenantQueryParam), since the
 *   whole point is avoiding a hostname that doesn't resolve locally.
 */
export const buildTenantApiOrigin = (rootDomain: string, protocol: string): string => {
  if (getTenantMode() === 'query') {
    return `${protocol}://${rootDomain}`;
  }

  const tenant = resolveTenant();

  if (!tenant) {
    if (typeof window !== 'undefined') {
      console.warn(
        '[tenant] Could not resolve a tenant subdomain from the current host ' +
        `("${window.location.hostname}"). API calls will 404 with "Tenant not found." ` +
        'Access this app via a tenant subdomain (e.g. tenant-a.localhost), set NUXT_PUBLIC_DEFAULT_TENANT, ' +
        'or set NUXT_PUBLIC_TENANT_MODE=query for local dev without DNS.'
      );
    }
    return `${protocol}://${rootDomain}`;
  }

  return `${protocol}://${tenant}.${rootDomain}`;
};

/**
 * Origin for the landlord-level public API (subscription plans catalog,
 * self-service signup) — these run on the bare root domain, before any
 * tenant has been picked, so unlike buildTenantApiOrigin() this never
 * prefixes a subdomain and never falls back to a resolved/default tenant.
 */
export const buildLandlordApiOrigin = (rootDomain: string, protocol: string): string =>
  `${protocol}://${rootDomain}`;

/** The tenant to send as ?tenant= — only meaningful in "query" mode. */
export const getTenantQueryParam = (): string | null =>
  getTenantMode() === 'query' ? resolveTenant() : null;

/**
 * Browser-navigation target for a *specific, known* tenant (post-signup
 * redirect, "find my workspace" login) — not an API call, so it's built
 * against the frontend's own window.location, not the backend API host.
 * Real subdomains aren't set up yet (no wildcard DNS/hosts entries), so in
 * "query" mode this deliberately ignores any subdomain-based URL the
 * backend might suggest and always targets the current host with
 * ?tenant= instead - that's the only thing that actually resolves today.
 */
export const buildTenantEntryUrl = (subdomain: string, path: string = '/auth/login'): string => {
  if (typeof window === 'undefined') return path;

  const { protocol, host } = window.location;

  return getTenantMode() === 'query'
    ? `${protocol}//${host}${path}?tenant=${encodeURIComponent(subdomain)}`
    : `${protocol}//${subdomain}.${host}${path}`;
};

export const appendTenantQueryParam = (url: string, tenant: string | null): string => {
  if (!tenant) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}tenant=${encodeURIComponent(tenant)}`;
};
