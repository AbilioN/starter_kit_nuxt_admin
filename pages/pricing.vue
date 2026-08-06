<script setup lang="ts">
import type { PublicSubscriptionPlan } from '~/types/api';
import { PublicPlansService } from '~/services/PublicPlansService';

definePageMeta({
  layout: 'public',
});

const plansService = new PublicPlansService();
const plans = ref<PublicSubscriptionPlan[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const formatPrice = (cents: number | null): string => {
  if (cents === null) return 'Free';
  return `$${(cents / 100).toFixed(2)}/mo`;
};

onMounted(async () => {
  const result = await plansService.listPlans();
  if (result.success && result.data) {
    plans.value = result.data;
  } else {
    error.value = result.error ?? 'Could not load plans.';
  }
  loading.value = false;
});
</script>

<template>
  <v-container class="py-12" max-width="1200">
    <div class="text-center mb-10">
      <h1 class="text-h3 font-weight-bold mb-2">Pricing</h1>
      <p class="text-body-1 text-medium-emphasis">Choose a plan and get your own workspace in minutes.</p>
    </div>

    <v-row v-if="loading" justify="center">
      <v-progress-circular indeterminate color="primary" />
    </v-row>

    <v-alert v-else-if="error" type="error" variant="tonal">{{ error }}</v-alert>

    <v-alert v-else-if="!plans.length" type="info" variant="tonal">
      No plans are available for self-service signup right now.
    </v-alert>

    <v-row v-else justify="center">
      <v-col v-for="plan in plans" :key="plan.id" cols="12" sm="6" md="4">
        <v-card
          rounded="lg"
          elevation="2"
          class="h-100 d-flex flex-column"
          :style="plan.tertiary_color ? { borderTop: `4px solid ${plan.tertiary_color}` } : undefined"
        >
          <v-card-item class="pa-6">
            <div v-if="plan.icon_medium_url" class="mb-4">
              <v-img :src="plan.icon_medium_url" :alt="plan.name" width="56" height="56" />
            </div>
            <div class="text-h5 font-weight-bold">{{ plan.name }}</div>
            <div class="text-h4 font-weight-bold mt-2" :style="plan.tertiary_color ? { color: plan.tertiary_color } : undefined">
              {{ formatPrice(plan.price_cents) }}
            </div>
          </v-card-item>

          <v-card-text class="flex-grow-1">
            <v-list density="compact" class="bg-transparent">
              <v-list-item
                v-for="(enabled, feature) in plan.features"
                :key="feature"
                :prepend-icon="enabled ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline'"
                :class="enabled ? 'text-body-2' : 'text-body-2 text-disabled'"
              >
                {{ feature.replace(/_/g, ' ') }}
              </v-list-item>
            </v-list>
          </v-card-text>

          <v-card-actions class="pa-6 pt-0">
            <v-btn
              block
              color="primary"
              size="large"
              :to="{ path: '/signup/checkout', query: { plan: plan.slug } }"
            >
              Choose {{ plan.name }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
