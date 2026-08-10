import Pusher from 'pusher-js';
import Echo from 'laravel-echo';
import { TenantService } from '~/services/TenantService';
import { getApiConfig } from '~/config/api';
import { appendTenantQueryParam } from '~/utils/tenant';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

// Async so it can resolve the current tenant's own Pusher app (if the
// GodAdmin assigned one — see InfrastructureProvider on the backend)
// before constructing Echo, instead of always using the build-time
// static key/cluster. Falls back to the static config on any failure or
// when the tenant has no override — same "progressive enhancement, never
// block the app" philosophy as useTenantTheme.ts.
export default defineNuxtPlugin(async () => {
  window.Pusher = Pusher;

  const config = useRuntimeConfig();
  const token = process.client ? (localStorage.getItem('auth_token') ?? '') : '';

  let pusherKey = config.public.pusherKey;
  let pusherCluster = config.public.pusherCluster;

  try {
    const theme = await new TenantService().getTheme();
    if (theme.success && theme.data?.pusher_key) {
      pusherKey = theme.data.pusher_key;
      pusherCluster = theme.data.pusher_cluster ?? pusherCluster;
    }
  } catch {
    // Non-critical — keep the static config, same as useTenantTheme.ts's
    // own non-critical failure handling for the rest of the theme response.
  }

  // Must go through the same tenant-aware URL building as ApiClient
  // (subdomain-prefixed origin, or ?tenant= in query mode) - pusher-js
  // posts straight to this URL itself, bypassing ApiClient entirely, so
  // building it from the static config.public.apiBaseUrl (no tenant
  // identification at all) made every private channel's auth callback hit
  // IdentifyTenant with no tenant to resolve -> 404 "Tenant not found.",
  // which fails the subscription silently and blocks all realtime delivery.
  const { publicBaseURL, tenantQueryParam } = getApiConfig();
  const authEndpoint = appendTenantQueryParam(`${publicBaseURL}/broadcasting/auth`, tenantQueryParam);

  const echo = new Echo({
    broadcaster: 'pusher',
    key: pusherKey,
    cluster: pusherCluster,
    forceTLS: true,
    authEndpoint,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });

  return {
    provide: {
      echo,
    },
  };
});
