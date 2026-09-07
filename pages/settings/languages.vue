<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PANEL_LANGUAGES } from '~/utils/languages';

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const { hasPermission } = usePermissions();
const { settings, loadSettings, updateSetting, error: settingsError } = useSettings();
const { load: reloadTenantLocales } = useTenantLocales();

const canEdit = computed(() => hasPermission('setting-update'));

const enabled = ref<string[]>([]);
const defaultLocale = ref<string>('');
const saving = ref(false);
const saved = ref(false);
const error = ref<string | null>(null);

/**
 * A tenant must operate in at least one language, and its default must be one
 * it actually offers — the backend refuses both, so mirroring the rules here
 * turns a 422 into a disabled button.
 */
const invalid = computed(
  () => enabled.value.length === 0 || !enabled.value.includes(defaultLocale.value),
);

/** Only the offered languages may be the default. */
const defaultChoices = computed(() =>
  PANEL_LANGUAGES.filter(l => enabled.value.includes(l.code)),
);

const parseLocaleList = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== 'string' || raw.trim() === '') return [];

  if (raw.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  return raw.split(',').map(s => s.trim()).filter(Boolean);
};

const toggle = (code: string) => {
  if (!canEdit.value) return;

  enabled.value = enabled.value.includes(code)
    ? enabled.value.filter(c => c !== code)
    : [...enabled.value, code];

  // Keep the default honest as the list shrinks, rather than letting it point
  // at a language no longer offered and only failing on save.
  if (!enabled.value.includes(defaultLocale.value)) {
    defaultLocale.value = enabled.value[0] ?? '';
  }
};

const save = async () => {
  if (invalid.value) return;

  saving.value = true;
  saved.value = false;
  error.value = null;

  try {
    // Enabled FIRST. The backend validates the default against the currently
    // enabled set, so writing them the other way round refuses a legitimate
    // change — turning on French and making it default in one action would
    // 422 on a language the server has not been told about yet.
    const ok =
      (await updateSetting('locales.enabled', enabled.value)) &&
      (await updateSetting('locales.default', defaultLocale.value));

    if (ok) {
      saved.value = true;
      // The switcher reads this list; without a refresh it keeps offering the
      // language just turned off until the next full page load.
      await reloadTenantLocales(true);
    } else {
      error.value = settingsError.value ?? t('languages.saveFailed');
    }
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await loadSettings();

  const raw = settings.value?.find((s: { key: string }) => s.key === 'locales.enabled')?.value;

  // Same tolerance as TenantLocales on the backend and useTenantLocales in
  // the header: the seeded shape is a JSON array, but this key was editable as
  // free text on the General tab before this screen existed, so a
  // comma-separated value is a real thing to find. A narrower parser here
  // would render "no languages enabled" for a value the rest of the system
  // reads as two — and JSON.parse on a malformed string would throw inside
  // onMounted, leaving the screen blank.
  enabled.value = parseLocaleList(raw);

  defaultLocale.value = String(
    settings.value?.find((s: { key: string }) => s.key === 'locales.default')?.value ?? '',
  );
});
</script>

<template>
  <div>
    <h2 class="text-h5 mb-1">{{ t('languages.title') }}</h2>
    <p class="text-body-2 text-medium-emphasis mb-4">{{ t('languages.subtitle') }}</p>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable>{{ error }}</v-alert>

    <v-card elevation="0" border max-width="640">
      <v-card-item>
        <v-card-title class="text-subtitle-1">{{ t('languages.offeredTitle') }}</v-card-title>
        <v-card-subtitle class="text-wrap">{{ t('languages.offeredHelp') }}</v-card-subtitle>
      </v-card-item>

      <v-card-text>
        <v-list density="compact" class="pa-0">
          <v-list-item
            v-for="lang in PANEL_LANGUAGES"
            :key="lang.code"
            class="px-0"
            @click="toggle(lang.code)"
          >
            <template #prepend>
              <v-checkbox-btn
                :model-value="enabled.includes(lang.code)"
                :disabled="!canEdit"
                density="compact"
              />
            </template>

            <v-list-item-title>
              {{ lang.label }}
              <v-chip
                v-if="lang.code === defaultLocale"
                size="x-small"
                color="primary"
                variant="tonal"
                class="ml-2"
              >
                {{ t('languages.isDefault') }}
              </v-chip>
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <v-divider class="my-4" />

        <v-select
          v-model="defaultLocale"
          :items="defaultChoices"
          item-title="label"
          item-value="code"
          :label="t('languages.defaultLabel')"
          :hint="t('languages.defaultHelp')"
          persistent-hint
          :disabled="!canEdit || defaultChoices.length === 0"
          variant="outlined"
          density="comfortable"
        />

        <v-alert type="info" variant="tonal" density="compact" class="mt-4">
          {{ t('languages.disablingIsSafe') }}
        </v-alert>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-chip v-if="saved" color="success" size="small" variant="tonal">
          {{ t('common.saved') }}
        </v-chip>
        <v-spacer />
        <v-btn
          color="primary"
          variant="flat"
          :loading="saving"
          :disabled="!canEdit || invalid"
          @click="save"
        >
          {{ t('common.actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
