<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import type { Setting } from '~/types/api';

definePageMeta({
  middleware: 'auth',
});

const { can } = usePermissions();
const {
  settings,
  groupedSettings,
  loading,
  saving,
  error,
  loadSettings,
  updateManySettings,
} = useSettings();

// Active tab
const activeTab = ref('general');
const tabs = [
  { key: 'general', label: 'General', icon: 'mdi-cog-outline' },
  { key: 'email', label: 'Email', icon: 'mdi-email-outline' },
  { key: 'storage', label: 'Storage', icon: 'mdi-harddisk' },
  { key: 'features', label: 'Feature Flags', icon: 'mdi-flag-outline' },
];

// Local draft copies of values — keyed by setting.key
const drafts = reactive<Record<string, Setting['value']>>({});

// Populate drafts whenever settings load
watch(settings, (newSettings) => {
  for (const s of newSettings) {
    if (!(s.key in drafts)) {
      drafts[s.key] = s.value;
    }
  }
}, { immediate: true });

const currentGroupSettings = computed(() =>
  groupedSettings.value[activeTab.value] ?? []
);

const hasChanges = computed(() => {
  return currentGroupSettings.value.some(s => drafts[s.key] !== s.value);
});

const saveGroup = async () => {
  const items = currentGroupSettings.value.map(s => ({
    key: s.key,
    value: drafts[s.key] ?? s.value,
  }));
  const ok = await updateManySettings(items);
  if (ok) {
    // Sync drafts to reflect saved values
    for (const item of items) {
      const saved = settings.value.find(s => s.key === item.key);
      if (saved) drafts[item.key] = saved.value;
    }
  }
};

const resetGroup = () => {
  for (const s of currentGroupSettings.value) {
    drafts[s.key] = s.value;
  }
};

const labelForGroup = (group: string) =>
  tabs.find(t => t.key === group)?.label ?? group;

onMounted(() => loadSettings());
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">Settings</h1>
            <p class="text-body-1 text-medium-emphasis">
              Configure your application settings
            </p>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Permission denied -->
    <v-row v-if="!can('setting-read')">
      <v-col cols="12">
        <v-alert type="warning" variant="tonal">
          You don't have permission to view settings.
        </v-alert>
      </v-col>
    </v-row>

    <template v-else>
      <!-- Tabs -->
      <v-tabs v-model="activeTab" color="primary" class="mb-4">
        <v-tab v-for="tab in tabs" :key="tab.key" :value="tab.key">
          <v-icon start>{{ tab.icon }}</v-icon>
          {{ tab.label }}
        </v-tab>
      </v-tabs>

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

      <!-- Settings form -->
      <v-row v-else>
        <v-col cols="12">
          <UiChildCard :title="labelForGroup(activeTab) + ' Settings'">
            <!-- Empty state -->
            <div
              v-if="currentGroupSettings.length === 0"
              class="d-flex flex-column align-center justify-center py-12 text-medium-emphasis"
            >
              <v-icon size="64" class="mb-4">mdi-cog-off-outline</v-icon>
              <p>No settings found for this group.</p>
            </div>

            <!-- Settings list -->
            <v-row v-else>
              <v-col
                v-for="setting in currentGroupSettings"
                :key="setting.key"
                cols="12"
                md="6"
              >
                <!-- Boolean -->
                <div v-if="setting.type === 'boolean'" class="settings-row">
                  <div class="settings-label">
                    <div class="font-weight-medium">{{ setting.label }}</div>
                    <div v-if="setting.description" class="text-caption text-medium-emphasis">
                      {{ setting.description }}
                    </div>
                  </div>
                  <v-switch
                    v-model="drafts[setting.key]"
                    :true-value="true"
                    :false-value="false"
                    color="primary"
                    hide-details
                    :disabled="!can('setting-update')"
                  />
                </div>

                <!-- Integer -->
                <v-text-field
                  v-else-if="setting.type === 'integer'"
                  v-model.number="drafts[setting.key]"
                  :label="setting.label"
                  :hint="setting.description ?? undefined"
                  persistent-hint
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  :readonly="!can('setting-update')"
                />

                <!-- JSON -->
                <v-textarea
                  v-else-if="setting.type === 'json'"
                  v-model="drafts[setting.key]"
                  :label="setting.label"
                  :hint="setting.description ?? undefined"
                  persistent-hint
                  variant="outlined"
                  density="comfortable"
                  rows="4"
                  font-family="monospace"
                  :readonly="!can('setting-update')"
                />

                <!-- String (default) -->
                <v-text-field
                  v-else
                  v-model="drafts[setting.key]"
                  :label="setting.label"
                  :hint="setting.description ?? undefined"
                  persistent-hint
                  variant="outlined"
                  density="comfortable"
                  :readonly="!can('setting-update')"
                />
              </v-col>
            </v-row>

            <!-- Actions -->
            <template v-if="can('setting-update') && currentGroupSettings.length > 0">
              <v-divider class="my-6" />
              <div class="d-flex align-center gap-3">
                <v-btn
                  color="primary"
                  :loading="saving"
                  :disabled="saving || !hasChanges"
                  prepend-icon="mdi-content-save-outline"
                  @click="saveGroup"
                >
                  Save {{ labelForGroup(activeTab) }} Settings
                </v-btn>
                <v-btn
                  variant="text"
                  :disabled="saving || !hasChanges"
                  @click="resetGroup"
                >
                  Discard Changes
                </v-btn>
                <v-chip v-if="hasChanges" color="warning" variant="tonal" size="small">
                  Unsaved changes
                </v-chip>
              </div>
            </template>
          </UiChildCard>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<style scoped>
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.settings-label {
  flex: 1;
  min-width: 0;
  padding-right: 16px;
}
</style>
