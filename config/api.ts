import { buildLandlordApiOrigin, buildTenantApiOrigin, getTenantMode, getTenantQueryParam } from '~/utils/tenant';

// Root domain the resolved tenant subdomain gets prefixed onto in the
// default "subdomain" mode, e.g. "starterkit.test:8006" ->
// "http://tenant-a.starterkit.test:8006". Override with NUXT_PUBLIC_API_ROOT_DOMAIN.
// In "query" mode (NUXT_PUBLIC_TENANT_MODE=query) this is hit directly with
// no subdomain prefix, so it defaults to plain localhost instead.
const DEFAULT_API_ROOT_DOMAIN_SUBDOMAIN = 'starterkit.test:8006';
const DEFAULT_API_ROOT_DOMAIN_QUERY = 'localhost:8006';
const DEFAULT_API_PROTOCOL = 'http';

export const API_CONFIG = {
  TIMEOUT: 10000,
  ENDPOINTS: {
    LOGIN: '/login',
    LOGOUT: '/logout',
    ME: '/me',
    IMPERSONATION: '/impersonation', // relative to baseURL (/api/admin)
    IMPERSONATION_STOP: '/impersonation/stop',
    TENANT_THEME: '/tenant/theme', // relative to publicBaseURL (/api)
    TENANT_SUBSCRIPTION_PLAN: '/tenant/subscription-plan', // relative to baseURL (/api/admin)
    TENANT_BRANDING: '/tenant/branding', // relative to baseURL (/api/admin)
    TENANT_SUBSCRIPTION_HISTORY: '/tenant/subscription-history', // relative to baseURL (/api/admin), tenant owner only
    PUBLIC_SUBSCRIPTION_PLANS: '/subscription-plans', // relative to getLandlordApiConfig().publicBaseURL (/api/public)
    PUBLIC_SIGNUP: '/signup', // relative to getLandlordApiConfig().publicBaseURL (/api/public)
  }
} as const;

export const getApiConfig = () => {
  const defaultRootDomain = getTenantMode() === 'query'
    ? DEFAULT_API_ROOT_DOMAIN_QUERY
    : DEFAULT_API_ROOT_DOMAIN_SUBDOMAIN;
  const runtimeConfig = useRuntimeConfig();
  const rootDomain = runtimeConfig.public.apiRootDomain || defaultRootDomain;
  const protocol = runtimeConfig.public.apiProtocol || DEFAULT_API_PROTOCOL;
  const origin = buildTenantApiOrigin(rootDomain, protocol);

  return {
    baseURL: process.env.NUXT_API_BASE_URL || `${origin}/api/admin`,
    publicBaseURL: process.env.NUXT_PUBLIC_API_BASE_URL || `${origin}/api`,
    timeout: API_CONFIG.TIMEOUT,
    // Only set in "query" mode — every request must carry this as ?tenant=
    // since the host itself no longer identifies the tenant.
    tenantQueryParam: getTenantQueryParam(),
  };
};

/**
 * Config for the landlord-level public API (pricing page, self-service
 * signup) — no tenant subdomain, no auth token. Reuses the same root
 * domain/protocol resolution as getApiConfig() (so local dev env overrides
 * still apply), but the origin itself is always bare via buildLandlordApiOrigin().
 */
export const getLandlordApiConfig = () => {
  const defaultRootDomain = getTenantMode() === 'query'
    ? DEFAULT_API_ROOT_DOMAIN_QUERY
    : DEFAULT_API_ROOT_DOMAIN_SUBDOMAIN;
  const runtimeConfig = useRuntimeConfig();
  const rootDomain = runtimeConfig.public.apiRootDomain || defaultRootDomain;
  const protocol = runtimeConfig.public.apiProtocol || DEFAULT_API_PROTOCOL;
  const origin = buildLandlordApiOrigin(rootDomain, protocol);

  return {
    publicBaseURL: `${origin}/api/public`,
    timeout: API_CONFIG.TIMEOUT,
  };
};