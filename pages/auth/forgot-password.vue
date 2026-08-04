<script setup lang="ts">
import { ref } from 'vue';
import { getApiConfig } from '~/config/api';
import { appendTenantQueryParam } from '~/utils/tenant';

definePageMeta({ layout: 'blank' });

const email = ref('');
const loading = ref(false);
const sent = ref(false);
const error = ref('');

const submit = async () => {
  if (!email.value) return;
  loading.value = true;
  error.value = '';
  try {
    const { publicBaseURL, tenantQueryParam } = getApiConfig();
    const url = appendTenantQueryParam(`${publicBaseURL}/forgot-password`, tenantQueryParam);
    const res = await $fetch(url, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    }) as any;
    if (res.message) sent.value = true;
  } catch (err: any) {
    error.value = err?.data?.message ?? 'Failed to send reset email. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="authentication">
    <v-container fluid class="pa-3">
      <v-row class="h-100vh d-flex justify-center align-center">
        <v-col cols="12" class="d-flex align-center">
          <div class="boxed-auth-wrap">
            <v-card rounded="lg" elevation="2" class="px-sm-1 px-0 mx-auto index-2" max-width="450">
              <v-card-item class="pa-sm-8">
                <div class="d-flex justify-center mb-5">
                  <LayoutFullLogoDark />
                </div>
                <div class="text-center mb-6">
                  <v-icon size="40" color="primary" class="mb-2">mdi-lock-reset</v-icon>
                  <h1 class="text-h5 font-weight-bold">Forgot Password</h1>
                  <p class="text-body-2 text-medium-emphasis mt-1">
                    Enter your email and we'll send you a reset link.
                  </p>
                </div>

                <div v-if="sent">
                  <v-alert type="success" variant="tonal" class="mb-4">
                    Check your email for a password reset link.
                  </v-alert>
                  <v-btn block variant="text" to="/auth/login">Back to Login</v-btn>
                </div>

                <v-form v-else @submit.prevent="submit">
                  <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
                    {{ error }}
                  </v-alert>

                  <v-text-field
                    v-model="email"
                    label="Email Address"
                    type="email"
                    prepend-inner-icon="mdi-email-outline"
                    autocomplete="email"
                    class="mb-4"
                    :disabled="loading"
                  />

                  <v-btn
                    type="submit"
                    color="primary"
                    block
                    size="large"
                    :loading="loading"
                    :disabled="!email || loading"
                  >
                    Send Reset Link
                  </v-btn>

                  <div class="text-center mt-4">
                    <v-btn variant="text" size="small" to="/auth/login">Back to Login</v-btn>
                  </div>
                </v-form>
              </v-card-item>
            </v-card>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
