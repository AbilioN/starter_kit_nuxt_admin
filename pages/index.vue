<script setup lang="ts">
// Always the public marketing homepage — no auth/tenant-detection redirect.
// Real tenant subdomains aren't wired up yet (no wildcard DNS/hosts
// entries), so detecting "is this a tenant or the root domain" from the
// hostname alone isn't reliable in the current ?tenant=-only setup (a
// leftover dev_tenant_override in localStorage from testing a tenant would
// make every visit to "/" look like a tenant visit). Once real subdomains
// are in use, "/" on an actual tenant subdomain can go back to redirecting
// to /dashboard or /auth/login — not needed for now.
definePageMeta({
  layout: "public",
});
</script>

<template>
  <div>
    <v-app-bar flat color="transparent" class="px-4">
      <v-toolbar-title class="font-weight-bold text-primary">MyCRM</v-toolbar-title>
      <v-spacer />
      <v-btn variant="text" to="/pricing">Pricing</v-btn>
      <v-btn variant="text" to="/login">Login</v-btn>
      <v-btn color="primary" variant="flat" to="/pricing" class="ml-2">Get Started</v-btn>
    </v-app-bar>

    <v-container class="py-16 text-center" max-width="800">
      <h1 class="text-h2 font-weight-bold mb-4">Run your business on MyCRM</h1>
      <p class="text-h6 font-weight-regular text-medium-emphasis mb-8">
        Chat, roles &amp; permissions, audit trail and a full admin panel — your own isolated workspace, ready in minutes.
      </p>
      <div class="d-flex justify-center ga-4 flex-wrap">
        <v-btn color="primary" size="x-large" to="/pricing">View Plans</v-btn>
        <v-btn variant="outlined" size="x-large" to="/login">I already have a workspace</v-btn>
      </div>
    </v-container>

    <v-container class="pb-16" max-width="1000">
      <v-row>
        <v-col cols="12" sm="4" class="text-center">
          <v-icon icon="mdi-shield-lock-outline" size="40" color="primary" class="mb-2" />
          <div class="text-subtitle-1 font-weight-bold">Roles &amp; Permissions</div>
          <p class="text-body-2 text-medium-emphasis">Fine-grained RBAC for every admin in your workspace.</p>
        </v-col>
        <v-col cols="12" sm="4" class="text-center">
          <v-icon icon="mdi-message-text-outline" size="40" color="primary" class="mb-2" />
          <div class="text-subtitle-1 font-weight-bold">Real-time Chat</div>
          <p class="text-body-2 text-medium-emphasis">Private and group conversations, built in.</p>
        </v-col>
        <v-col cols="12" sm="4" class="text-center">
          <v-icon icon="mdi-file-document-check-outline" size="40" color="primary" class="mb-2" />
          <div class="text-subtitle-1 font-weight-bold">Full Audit Trail</div>
          <p class="text-body-2 text-medium-emphasis">Immutable, compliance-ready activity logs.</p>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
