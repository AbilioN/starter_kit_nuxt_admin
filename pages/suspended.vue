<script setup lang="ts">
// Landed here via a hard-redirect from ApiClient.request() (401-style
// precedent) or TenantRepository.getTheme() whenever the API responds with
// 403 + { error: "tenant_suspended" } — see utils/tenant.ts and
// docs/2026-08-07_tenant-suspended-screen-prompt.md. Uses the "public"
// layout deliberately: it never fetches tenant theme/branding, since a
// suspended tenant's theme endpoint is exactly what's returning the error.
definePageMeta({
  layout: 'public',
});

const { t } = useI18n();
</script>

<template>
  <div class="d-flex justify-center align-center text-center h-100 py-16">
    <div style="max-width: 480px">
      <v-icon icon="mdi-lock-alert-outline" size="96" color="warning" class="mb-6" />
      <h1 class="text-h4 font-weight-bold mb-4">{{ t('pages.suspended.title') }}</h1>
      <p class="text-body-1 text-medium-emphasis mb-2">{{ t('pages.suspended.message') }}</p>
      <p class="text-body-2 text-medium-emphasis">{{ t('pages.suspended.supportHint') }}</p>
    </div>
  </div>
</template>
