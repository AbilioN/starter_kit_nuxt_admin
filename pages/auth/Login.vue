<script setup lang="ts">
/*-For Set Blank Layout-*/
definePageMeta({
  layout: "blank",
});

const { t } = useI18n();

// ApiClient stashes the failing request here right before its hard
// redirect-on-401 reload (which would otherwise wipe the console before
// anyone could see what happened) — surface it once, then clear it.
const last401 = ref<{ method: string; url: string; at: string } | null>(null);
onMounted(() => {
  const raw = sessionStorage.getItem('last_401');
  if (raw) {
    sessionStorage.removeItem('last_401');
    try {
      last401.value = JSON.parse(raw);
      console.warn('[auth] Logged out by a 401 from:', last401.value);
    } catch {
      // ignore malformed entry
    }
  }
});
</script>
<template>
    <div class="authentication">
        <v-container fluid class="pa-3">
            <v-row class="h-100vh d-flex justify-center align-center">
                <v-col cols="12" class="d-flex align-center">
                    <div class="boxed-auth-wrap">
                        <v-card rounded="lg" elevation="2" class="px-sm-1 px-0  mx-auto index-2" max-width="450">
                            <v-card-item class="pa-sm-8">
                                <div class="d-flex justify-center mb-5">
                                    <LayoutFullLogoDark />
                                </div>
                                <v-alert v-if="last401" type="warning" variant="tonal" density="compact" class="mb-4" closable @click:close="last401 = null">
                                    {{ t('auth.login.signedOutAlert', { method: last401.method, url: last401.url }) }}
                                </v-alert>
                                <AuthLoginForm />
                                <h6 class="text-subtitle-1  text-grey100 d-flex justify-center align-center mt-3">
                                    {{ t('auth.login.newHere') }}
                                    <v-btn class="pl-0 text-primary text-body-1 font-weight-medium  opacity-1 pl-2" height="auto"
                                        to="/auth/register" variant="plain">{{ t('auth.login.createAccount') }}</v-btn>
                                </h6>
                            </v-card-item>
                        </v-card>
                    </div>
                </v-col>
            </v-row>

        </v-container>
    </div>
</template>
