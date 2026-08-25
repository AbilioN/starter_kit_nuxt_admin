<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import type { Template } from '~/types/api';

/**
 * One tab per language the TENANT runs, not per language already written.
 *
 * That distinction is the whole point. A tenant enabling four languages and
 * writing one is the normal state of a template halfway through being
 * translated, and a UI that only showed what exists would give the author no
 * way in — they would have to know to create a second template and guess that
 * it belongs to the same group. An empty tab is the affordance.
 *
 * A tenant running a single language sees no tabs at all: the whole feature
 * disappears rather than adding a control that can only ever have one value.
 */
const props = defineProps<{
  templateId: string;
  currentLocale: string | null;
}>();

const emit = defineEmits<{ create: [locale: string] }>();

const { t } = useI18n();
const { fieldCatalog, loadFieldCatalog, translations, loadTranslations } = useTemplates();

onMounted(async () => {
  await Promise.all([loadFieldCatalog(), loadTranslations(props.templateId)]);
});

// Same reason the page recomputes its id: navigating between tabs reuses this
// component, so the group has to be re-fetched rather than kept from mount.
watch(() => props.templateId, (id) => loadTranslations(id));

const byLocale = computed(() => {
  const map = new Map<string, Template>();
  for (const translation of translations.value) {
    if (translation.locale) map.set(translation.locale, translation);
  }
  return map;
});

// Enabled languages first, then any language that has a translation but is no
// longer enabled — a tenant that drops a language must still be able to reach
// what was written in it, if only to delete it.
const tabs = computed(() => {
  const enabled = fieldCatalog.value?.locales.enabled ?? [];
  const orphans = [...byLocale.value.keys()].filter((locale) => !enabled.includes(locale));

  return [...enabled, ...orphans].map((locale) => ({
    locale,
    template: byLocale.value.get(locale) ?? null,
    isDefault: locale === fieldCatalog.value?.locales.default,
  }));
});

const showsTabs = computed(() => tabs.value.length > 1);
</script>

<template>
  <div v-if="showsTabs" class="locale-tabs mb-4">
    <div class="text-caption text-medium-emphasis mb-1">{{ t('pages.templates.languagesLabel') }}</div>
    <v-tabs :model-value="props.currentLocale" density="compact" show-arrows>
      <v-tab
        v-for="tab in tabs"
        :key="tab.locale"
        :value="tab.locale"
        :to="tab.template ? `/templates/${tab.template.id}/edit` : undefined"
        @click="!tab.template && emit('create', tab.locale)"
      >
        {{ tab.locale.toUpperCase() }}
        <v-icon v-if="tab.isDefault" size="x-small" class="ml-1" :title="t('pages.templates.defaultLanguage')">
          mdi-star
        </v-icon>
        <!-- An empty tab reads as "not written yet", not as an error: a
             template does not have to exist in every language to be sent. -->
        <v-chip v-if="!tab.template" size="x-small" variant="tonal" class="ml-2">
          {{ t('pages.templates.notTranslated') }}
        </v-chip>
      </v-tab>
    </v-tabs>
  </div>
</template>

<style scoped>
.locale-tabs {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
