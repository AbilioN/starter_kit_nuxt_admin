<script setup lang="ts">
import { AuthService } from '~/services/AuthService';
import { getTenantSubdomain } from '~/utils/tenant';

/**
 * Handover point for a GodAdmin support session.
 *
 * The GodAdmin panel is a server-rendered Livewire app on the backend's origin;
 * this SPA keeps its token in localStorage. A redirect carrying the token is
 * how the two meet. The token is short-lived and single-purpose, which is what
 * makes putting it in a URL acceptable here — it is stored and the URL is
 * replaced immediately so it does not survive in history.
 *
 * Deliberately has no `auth` middleware: there is no session yet when this page
 * opens, which is the whole point.
 */
definePageMeta({ layout: 'blank' });

const route = useRoute();
const error = ref('');

onMounted(async () => {
  const token = route.query.token as string | undefined;

  if (!token) {
    error.value = 'This link is missing its session token.';
    return;
  }

  // Resolving the tenant persists the ?tenant= override, so every API call
  // made after this redirect is scoped to the right tenant. Must happen
  // before the first request, not after.
  getTenantSubdomain();

  localStorage.setItem('auth_token', token);

  // Drop the token from the address bar before anything else can read it —
  // replaceState rather than push so the back button cannot restore it.
  window.history.replaceState({}, '', '/impersonate');

  const admin = await new AuthService().getCurrentUser();

  if (!admin) {
    localStorage.removeItem('auth_token');
    error.value = 'This support session could not be started. It may have already expired.';
    return;
  }

  localStorage.setItem('user', JSON.stringify(admin));

  const { load } = useImpersonation();
  await load(true);

  await navigateTo('/dashboard', { replace: true });
});
</script>

<template>
  <v-container class="d-flex align-center justify-center" style="min-height: 100vh">
    <v-card v-if="error" max-width="420" class="pa-6 text-center">
      <h2 class="text-h6 mb-2">Support session</h2>
      <p class="text-body-2 mb-4">{{ error }}</p>
      <v-btn color="primary" variant="flat" to="/auth/login">Go to login</v-btn>
    </v-card>

    <div v-else class="text-center">
      <v-progress-circular indeterminate color="primary" size="40" />
      <p class="text-body-2 mt-4">Starting support session…</p>
    </div>
  </v-container>
</template>
