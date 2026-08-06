<script setup lang="ts">
import type { PublicSubscriptionPlan } from '~/types/api';
import { PublicPlansService } from '~/services/PublicPlansService';
import { buildTenantEntryUrl } from '~/utils/tenant';

definePageMeta({
  layout: 'public',
});

const route = useRoute();
const plansService = new PublicPlansService();

const planSlug = computed(() => (typeof route.query.plan === 'string' ? route.query.plan : null));
const plan = ref<PublicSubscriptionPlan | null>(null);
const planLoading = ref(false);

const form = reactive({
  name: '',
  subdomain: '',
  admin_email: '',
  admin_password: '',
  admin_password_confirmation: '',
});

// Purely cosmetic — never sent to the backend. There is no real payment
// gateway; this step only exists so the flow feels like a real checkout.
const mockCard = reactive({
  number: '',
  expiry: '',
  cvv: '',
});

const submitting = ref(false);
const error = ref<string | null>(null);

const subdomainRule = (v: string) => /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(v) || 'Lowercase letters, numbers and hyphens only.';
const requiredRule = (v: string) => !!v || 'Required.';
const emailRule = (v: string) => /.+@.+\..+/.test(v) || 'Must be a valid email.';
const passwordMatchRule = (v: string) => v === form.admin_password || 'Passwords do not match.';

onMounted(async () => {
  if (!planSlug.value) return;
  planLoading.value = true;
  const result = await plansService.getPlan(planSlug.value);
  if (result.success && result.data) {
    plan.value = result.data;
  }
  planLoading.value = false;
});

const formatPrice = (cents: number | null): string => {
  if (cents === null) return 'Free';
  return `$${(cents / 100).toFixed(2)}/mo`;
};

const submit = async () => {
  error.value = null;
  submitting.value = true;

  const result = await plansService.signup({
    name: form.name,
    subdomain: form.subdomain,
    plan_id: plan.value?.id,
    admin_email: form.admin_email,
    admin_password: form.admin_password,
    admin_password_confirmation: form.admin_password_confirmation,
  });

  submitting.value = false;

  if (!result.success || !result.data) {
    error.value = result.error ?? 'Signup failed. Please try again.';
    return;
  }

  // Ignore the backend's subdomain-based redirect_url — real subdomains
  // aren't wired up yet (no wildcard DNS/hosts entries), so build the URL
  // the same tenant-mode-aware way the "find my workspace" login page does.
  window.location.href = buildTenantEntryUrl(result.data.subdomain);
};
</script>

<template>
  <v-container class="py-12" max-width="600">
    <v-card rounded="lg" elevation="2">
      <v-card-item class="pa-6">
        <div class="text-h5 font-weight-bold mb-1">Create your workspace</div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          No credit card is actually charged — this is a demo checkout.
        </p>
      </v-card-item>

      <v-card-text class="pa-6 pt-0">
        <v-alert v-if="planLoading" type="info" variant="tonal" density="compact" class="mb-4">
          Loading plan…
        </v-alert>
        <v-alert v-else-if="plan" type="success" variant="tonal" density="compact" class="mb-4">
          <strong>{{ plan.name }}</strong> — {{ formatPrice(plan.price_cents) }}
        </v-alert>
        <v-alert v-else-if="planSlug" type="warning" variant="tonal" density="compact" class="mb-4">
          Selected plan is no longer available — you can still sign up without a plan.
        </v-alert>

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
          {{ error }}
        </v-alert>

        <v-form @submit.prevent="submit">
          <div class="text-overline mb-2">Workspace</div>
          <v-text-field v-model="form.name" label="Company / workspace name" :rules="[requiredRule]" class="mb-2" />
          <v-text-field v-model="form.subdomain" label="Subdomain" suffix=".starterkit.test" :rules="[requiredRule, subdomainRule]" class="mb-2" />

          <div class="text-overline mb-2 mt-4">Owner account</div>
          <v-text-field v-model="form.admin_email" type="email" label="Your email" :rules="[requiredRule, emailRule]" class="mb-2" />
          <v-text-field v-model="form.admin_password" type="password" label="Password" :rules="[requiredRule]" class="mb-2" />
          <v-text-field v-model="form.admin_password_confirmation" type="password" label="Confirm password" :rules="[requiredRule, passwordMatchRule]" class="mb-2" />

          <div class="text-overline mb-2 mt-4">🧪 Demo payment — no real charge</div>
          <v-text-field v-model="mockCard.number" label="Card number" placeholder="4242 4242 4242 4242" class="mb-2" />
          <div class="d-flex ga-2">
            <v-text-field v-model="mockCard.expiry" label="Expiry" placeholder="MM/YY" />
            <v-text-field v-model="mockCard.cvv" label="CVV" placeholder="123" />
          </div>

          <v-btn type="submit" color="primary" size="large" block :loading="submitting" class="mt-2">
            Confirm &amp; Create Workspace
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>
