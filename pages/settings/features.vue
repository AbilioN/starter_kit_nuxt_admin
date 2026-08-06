<script setup lang="ts">
import { onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';

definePageMeta({
  middleware: 'auth',
});

const { t } = useI18n();
const { can } = usePermissions();
const {
  featureFlags,
  loading,
  error,
  loadSettings,
  updateSetting,
} = useSettings();

const notification = useNotification();
const toggling = ref<string | null>(null);

const toggle = async (key: string, current: boolean | string | number | null) => {
  if (!can('setting-update')) return;

  const newValue = !(current === true || current === 'true' || current === '1' || current === 1);
  toggling.value = key;
  try {
    const ok = await updateSetting(key, newValue);
    if (!ok) {
      notification.error('Failed to update feature flag');
    }
  } finally {
    toggling.value = null;
  }
};

const isEnabled = (value: boolean | string | number | null): boolean =>
  value === true || value === 'true' || value === '1' || value === 1;

onMounted(() => loadSettings('features'));
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">{{ t('pages.featureFlags.title') }}</h1>
            <p class="text-body-1 text-medium-emphasis">
              {{ t('pages.featureFlags.subtitle') }}
            </p>
          </div>
          <v-btn
            variant="tonal"
            prepend-icon="mdi-cog-outline"
            :to="'/settings'"
          >
            {{ t('pages.featureFlags.allSettings') }}
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Permission denied -->
    <v-row v-if="!can('setting-read')">
      <v-col cols="12">
        <v-alert type="warning" variant="tonal">
          {{ t('pages.featureFlags.noPermission') }}
        </v-alert>
      </v-col>
    </v-row>

    <template v-else>
      <!-- Loading -->
      <v-row v-if="loading">
        <v-col cols="12">
          <UiChildCard>
            <div class="d-flex justify-center align-center py-12">
              <v-progress-circular indeterminate color="primary" size="64" />
            </div>
          </UiChildCard>
        </v-col>
      </v-row>

      <!-- Error -->
      <v-row v-else-if="error">
        <v-col cols="12">
          <v-alert type="error" variant="tonal">{{ error }}</v-alert>
        </v-col>
      </v-row>

      <!-- Flags list -->
      <v-row v-else>
        <v-col cols="12">
          <UiChildCard :title="t('pages.featureFlags.title')">
            <!-- Empty state -->
            <div
              v-if="featureFlags.length === 0"
              class="d-flex flex-column align-center justify-center py-12 text-medium-emphasis"
            >
              <v-icon size="64" class="mb-4">mdi-flag-off-outline</v-icon>
              <p>{{ t('pages.featureFlags.noFlags') }}</p>
            </div>

            <!-- Flags -->
            <v-list v-else lines="two">
              <v-list-item
                v-for="flag in featureFlags"
                :key="flag.key"
                class="px-0"
              >
                <template #prepend>
                  <v-icon
                    :color="isEnabled(flag.value) ? 'success' : 'grey'"
                    class="mr-4"
                  >
                    {{ isEnabled(flag.value) ? 'mdi-flag' : 'mdi-flag-outline' }}
                  </v-icon>
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ flag.label }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  <span class="text-caption font-weight-bold text-mono">{{ flag.key }}</span>
                  <span v-if="flag.description" class="ml-2 text-caption">
                    · {{ flag.description }}
                  </span>
                </v-list-item-subtitle>

                <template #append>
                  <v-chip
                    :color="isEnabled(flag.value) ? 'success' : 'error'"
                    variant="tonal"
                    size="small"
                    class="mr-4"
                  >
                    {{ isEnabled(flag.value) ? t('pages.featureFlags.enabled') : t('pages.featureFlags.disabled') }}
                  </v-chip>

                  <v-switch
                    :model-value="isEnabled(flag.value)"
                    color="success"
                    hide-details
                    :loading="toggling === flag.key"
                    :disabled="!can('setting-update') || toggling !== null"
                    @update:model-value="toggle(flag.key, flag.value)"
                  />
                </template>
              </v-list-item>
            </v-list>

            <template v-if="!can('setting-update') && featureFlags.length > 0">
              <v-divider class="my-4" />
              <v-alert type="info" variant="tonal" density="compact">
                {{ t('pages.featureFlags.readOnlyNotice') }}
              </v-alert>
            </template>
          </UiChildCard>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<style scoped>
.text-mono {
  font-family: monospace;
}
</style>
