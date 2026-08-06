<script setup lang="ts">
import { ref } from 'vue';

const { t } = useI18n();
const checkbox = ref(false);
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

const { login } = useAuth();
const notification = useNotification();

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Please fill in all fields';
    notification.warning('Please fill in all fields');
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await login(email.value, password.value);
    
    if (result.success) {
      // Login bem-sucedido, redirecionar para dashboard
      notification.success('Login successful');
      navigateTo('/dashboard');
    } else {
      // Exibir a mensagem de erro específica da API
      errorMessage.value = result.error || 'Login failed';
      notification.error(result.error || 'Login failed');
    }
  } catch (error) {
    errorMessage.value = 'Unexpected error';
    notification.error('Unexpected error');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
    <form @submit.prevent="handleLogin">
        <v-row class="mb-3">
            <v-col cols="12">
                <v-label class="font-weight-medium mb-1">{{ t('auth.login.emailLabel') }}</v-label>
                <v-text-field
                    v-model="email"
                    variant="outlined"
                    class="pwdInput"
                    hide-details
                    color="primary"
                    type="email"
                    :disabled="loading"
                    :placeholder="t('auth.login.emailPlaceholder')"
                ></v-text-field>
            </v-col>
            <v-col cols="12">
                <v-label class="font-weight-medium mb-1">{{ t('auth.login.passwordLabel') }}</v-label>
                <v-text-field
                    v-model="password"
                    variant="outlined"
                    class="border-borderColor"
                    type="password"
                    hide-details
                    color="primary"
                    :disabled="loading"
                    :placeholder="t('auth.login.passwordPlaceholder')"
                ></v-text-field>
            </v-col>
            
            <!-- Mensagem de erro -->
            <v-col cols="12" v-if="errorMessage">
                <v-alert type="error" variant="tonal" class="mb-3">
                    <div class="d-flex align-center">
                        <v-icon class="mr-2">mdi-alert-circle</v-icon>
                        {{ errorMessage }}
                    </div>
                </v-alert>
            </v-col>
            
            <v-col cols="12 " class="py-0">
                <div class="d-flex flex-wrap align-center w-100 ">
                    <v-checkbox v-model="checkbox" hide-details color="primary">
                        <template v-slot:label>{{ t('auth.login.rememberDevice') }}</template>
                    </v-checkbox>
                    <div class="ml-sm-auto">
                        <RouterLink to="/auth/forgot-password"
                            class="text-primary text-decoration-none text-body-1 opacity-1 font-weight-medium">
                            {{ t('auth.login.forgotPassword') }}
                        </RouterLink>
                    </div>
                </div>
            </v-col>
            <v-col cols="12">
                <v-btn 
                    size="large" 
                    rounded="pill" 
                    color="primary" 
                    class="rounded-pill" 
                    block 
                    type="submit" 
                    flat
                    :loading="loading"
                    :disabled="loading"
                >
                    {{ loading ? t('auth.login.signingIn') : t('auth.login.signIn') }}
                </v-btn>
            </v-col>
        </v-row>
    </form>
</template>
