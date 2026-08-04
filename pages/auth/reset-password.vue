<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getApiConfig } from '~/config/api';
import { appendTenantQueryParam } from '~/utils/tenant';

definePageMeta({ layout: 'blank' });

const route = useRoute();
const token = ref('');
const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');
const loading = ref(false);
const done = ref(false);
const error = ref('');
const showPassword = ref(false);

onMounted(() => {
  token.value = String(route.query.token ?? '');
  email.value = String(route.query.email ?? '');
});

const submit = async () => {
  loading.value = true;
  error.value = '';
  try {
    const { publicBaseURL, tenantQueryParam } = getApiConfig();
    const url = appendTenantQueryParam(`${publicBaseURL}/reset-password`, tenantQueryParam);
    const res = await $fetch(url, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token.value,
        email: email.value,
        password: password.value,
        password_confirmation: passwordConfirmation.value,
      }),
    }) as any;
    if (res.message) done.value = true;
  } catch (err: any) {
    error.value = err?.data?.message ?? 'Failed to reset password. The link may have expired.';
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
                  <v-icon size="40" color="primary" class="mb-2">mdi-lock-check-outline</v-icon>
                  <h1 class="text-h5 font-weight-bold">Set New Password</h1>
                  <p class="text-body-2 text-medium-emphasis mt-1">{{ email }}</p>
                </div>

                <div v-if="done">
                  <v-alert type="success" variant="tonal" class="mb-4">
                    Password reset successfully! You can now log in.
                  </v-alert>
                  <v-btn block color="primary" to="/auth/login">Go to Login</v-btn>
                </div>

                <v-form v-else @submit.prevent="submit">
                  <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
                    {{ error }}
                  </v-alert>

                  <v-text-field
                    v-model="password"
                    label="New Password"
                    :type="showPassword ? 'text' : 'password'"
                    prepend-inner-icon="mdi-lock-outline"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showPassword = !showPassword"
                    class="mb-3"
                    :disabled="loading"
                  />

                  <v-text-field
                    v-model="passwordConfirmation"
                    label="Confirm New Password"
                    :type="showPassword ? 'text' : 'password'"
                    prepend-inner-icon="mdi-lock-outline"
                    class="mb-4"
                    :disabled="loading"
                  />

                  <v-btn
                    type="submit"
                    color="primary"
                    block
                    size="large"
                    :loading="loading"
                    :disabled="!password || !passwordConfirmation || loading"
                  >
                    Reset Password
                  </v-btn>
                </v-form>
              </v-card-item>
            </v-card>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
