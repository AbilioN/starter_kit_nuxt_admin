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

    // A custom authorizer instead of `authEndpoint` + a static
    // `auth.headers.Authorization`.
    //
    // This plugin runs ONCE, at app boot. On a cold start that is the login
    // page, where `auth_token` does not exist yet — so a header captured here
    // would be the literal string "Bearer " with no token. Logging in is a
    // client-side navigation, so Echo is never rebuilt and would keep that
    // empty header for the whole session: every private-channel auth call
    // returned 401 and every subscription failed silently, leaving the chat
    // with no realtime at all until the user happened to hard-refresh.
    // (Measured: `Bearer` -> 401 right after login, `Bearer 99|...` -> 200
    // after a reload.)
    //
    // Reading the token inside authorize() means it is resolved per request,
    // so it is always the current one — this also survives logout/login and a
    // token being replaced mid-session.
    authorizer: (channel: { name: string }) => ({
      authorize: (socketId: string, callback: (error: Error | null, data?: any) => void) => {
        fetch(authEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}`,
          },
          body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
        })
          .then(res => (res.ok
            ? res.json()
            : Promise.reject(new Error(`broadcasting/auth returned ${res.status} for ${channel.name}`))))
          .then(data => callback(null, data))
          .catch((err: Error) => {
            // pusher-js swallows subscription errors by default, which is what
            // made the 401 above invisible for so long — log it loudly.
            console.error('[echo] channel authorization failed:', err.message);
            callback(err);
          });
      },
    }),
  });

  return {
    provide: {
      echo,
    },
  };
});
