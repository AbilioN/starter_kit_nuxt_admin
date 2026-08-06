<script setup lang="ts">
import { buildTenantEntryUrl } from '~/utils/tenant';

// Login itself always happens on the tenant's own subdomain (/auth/login) —
// this page just exists so someone landing on the bare root domain (who
// already has a workspace) has a way to find it.
definePageMeta({
  layout: 'public',
});

const subdomain = ref('');
const requiredRule = (v: string) => !!v || 'Enter your workspace subdomain.';
const subdomainRule = (v: string) => /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(v) || 'Lowercase letters, numbers and hyphens only.';

const goToWorkspace = () => {
  if (!subdomain.value || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain.value)) return;

  window.location.href = buildTenantEntryUrl(subdomain.value);
};
</script>

<template>
  <v-container class="py-12" max-width="480">
    <v-card rounded="lg" elevation="2">
      <v-card-item class="pa-6">
        <div class="text-h5 font-weight-bold mb-1">Find your workspace</div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Enter your workspace's subdomain to go to its login page.
        </p>
      </v-card-item>

      <v-card-text class="pa-6 pt-0">
        <v-form @submit.prevent="goToWorkspace">
          <v-text-field
            v-model="subdomain"
            label="Subdomain"
            suffix=".starterkit.test"
            autofocus
            :rules="[requiredRule, subdomainRule]"
          />
          <v-btn type="submit" color="primary" size="large" block class="mt-2">Continue</v-btn>
        </v-form>

        <div class="text-center mt-6">
          <span class="text-body-2 text-medium-emphasis">Don't have a workspace yet?</span>
          <v-btn variant="text" color="primary" to="/pricing">View Plans</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>
