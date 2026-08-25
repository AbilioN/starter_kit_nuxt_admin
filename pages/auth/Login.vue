<script setup lang="ts">
/*-For Set Blank Layout-*/
definePageMeta({
  layout: "blank",
});

const { t } = useI18n();
const { tenantTheme, iconUrl } = useTenantTheme();

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
  <!--
    Split screen rather than the template's card floating on grey. The brand
    half is the only full-bleed surface in the product where all three tenant
    colours appear at once — gradient primary -> secondary, tertiary in the
    rules and the glow — which is what makes the login read as this tenant's
    product rather than as a generic admin sign-in.

    It collapses away below md: on a phone the panel would push the form off
    the fold, and the form is the only thing anyone came here to use.
  -->
  <div class="auth-split">
    <aside class="auth-brand d-none d-md-flex">
      <div class="auth-brand__glow" />

      <div class="auth-brand__content">
        <img
          v-if="iconUrl('medium')"
          :src="iconUrl('medium')!"
          :alt="tenantTheme?.name ?? ''"
          class="auth-brand__mark"
        />

        <h1 class="auth-brand__title">{{ tenantTheme?.name ?? t('app.title') }}</h1>
        <p class="auth-brand__tagline">{{ t('auth.login.brandTagline') }}</p>

        <ul class="auth-brand__points">
          <li>{{ t('auth.login.pointRoles') }}</li>
          <li>{{ t('auth.login.pointChat') }}</li>
          <li>{{ t('auth.login.pointAudit') }}</li>
        </ul>
      </div>
    </aside>

    <main class="auth-form">
      <div class="auth-form__inner">
        <div class="d-md-none mb-6 d-flex justify-center">
          <LayoutFullLogoDark />
        </div>

        <h2 class="auth-form__title">{{ t('auth.login.heading') }}</h2>
        <p class="auth-form__subtitle">{{ t('auth.login.subheading') }}</p>

        <v-alert
          v-if="last401"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-4"
          closable
          @click:close="last401 = null"
        >
          {{ t('auth.login.signedOutAlert', { method: last401.method, url: last401.url }) }}
        </v-alert>

        <AuthLoginForm />

        <p class="auth-form__footer">
          {{ t('auth.login.newHere') }}
          <NuxtLink to="/auth/register">{{ t('auth.login.createAccount') }}</NuxtLink>
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.auth-split {
  display: flex;
  min-height: 100vh;
}

/* ---------------------------------------------------------------- brand -- */

.auth-brand {
  position: relative;
  width: 46%;
  max-width: 620px;
  padding: 64px 56px;
  align-items: center;
  overflow: hidden;
  background: linear-gradient(150deg,
    rgb(var(--v-theme-primary)) 0%,
    rgb(var(--v-theme-secondary)) 100%);
}

/* An off-centre tertiary glow, so the panel is lit rather than a flat fill. */
.auth-brand__glow {
  position: absolute;
  inset: -30% -40% auto auto;
  width: 90%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(var(--v-theme-tertiary), 0.55) 0%,
    rgba(var(--v-theme-tertiary), 0) 68%);
  pointer-events: none;
}

.auth-brand__content {
  position: relative;
  z-index: 1;
  color: #fff;
}

.auth-brand__mark {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: block;
  margin-bottom: 28px;
  box-shadow: 0 12px 32px -12px rgba(0, 0, 0, 0.5);
}

.auth-brand__title {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 2.6rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 14px;
}

.auth-brand__tagline {
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.78);
  max-width: 30ch;
  margin-bottom: 40px;
}

.auth-brand__points {
  list-style: none;
  padding: 0;
  margin: 0;
}

.auth-brand__points li {
  position: relative;
  padding-left: 22px;
  margin-bottom: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.94rem;
}

/* The tertiary as a bullet: the third colour earning a job of its own. */
.auth-brand__points li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 9px;
  height: 3px;
  border-radius: 3px;
  background: rgb(var(--v-theme-tertiary));
}

/* ----------------------------------------------------------------- form -- */

.auth-form {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background:
    radial-gradient(700px 320px at 80% 0%, rgba(var(--v-theme-tertiary), 0.30), transparent 70%),
    rgb(var(--v-theme-surface));
}

.auth-form__inner {
  width: 100%;
  max-width: 400px;
}

.auth-form__title {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: rgb(var(--v-theme-grey200));
  margin-bottom: 6px;
}

.auth-form__subtitle {
  color: rgb(var(--v-theme-textSecondary));
  font-size: 0.9rem;
  margin-bottom: 28px;
}

.auth-form__footer {
  margin-top: 22px;
  text-align: center;
  font-size: 0.88rem;
  color: rgb(var(--v-theme-textSecondary));
}

.auth-form__footer a {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
}

.auth-form__footer a:hover {
  text-decoration: underline;
}
</style>
