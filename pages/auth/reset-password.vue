<script setup lang="ts">
import { ref, onMounted } from 'vue';

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
    const res = await $fetch('http://localhost:8006/api/reset-password', {
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
  <v-app>
    <v-main class="d-flex align-center justify-center" style="min-height: 100vh; background: #f5f5f5;">
      <v-card width="420" class="pa-6 rounded-xl elevation-4">
        <div class="text-center mb-6">
          <v-icon size="48" color="primary" class="mb-3">mdi-lock-check-outline</v-icon>
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
            variant="outlined"
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
            variant="outlined"
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
      </v-card>
    </v-main>
  </v-app>
</template>
