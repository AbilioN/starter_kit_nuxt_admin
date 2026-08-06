<script setup lang="ts">
const { locale, setLocale } = useI18n();

const languages = [
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'pt', flag: '🇵🇹', label: 'Português' },
] as const;

const switchLanguage = (code: typeof languages[number]['code']) => {
  setLocale(code);
};
</script>

<template>
  <div class="d-flex align-center ga-2">
    <button
      v-for="lang in languages"
      :key="lang.code"
      type="button"
      class="lang-flag-btn"
      :class="{ 'lang-flag-btn--active': locale === lang.code }"
      :title="lang.label"
      :aria-label="lang.label"
      @click="switchLanguage(lang.code)"
    >
      {{ lang.flag }}
    </button>
  </div>
</template>

<style scoped>
.lang-flag-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  background: rgb(var(--v-theme-containerBg));
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s ease, opacity 0.2s ease;
  opacity: 0.6;
}

.lang-flag-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.lang-flag-btn--active {
  opacity: 1;
  border-color: rgb(var(--v-theme-primary));
  transform: scale(1.05);
}
</style>
