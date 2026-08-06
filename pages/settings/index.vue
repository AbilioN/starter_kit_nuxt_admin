<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import type { Setting } from '~/types/api';

definePageMeta({
  middleware: 'auth',
});

const { t } = useI18n();
const { can } = usePermissions();
const { user: admin } = useAuth();
const {
  settings,
  groupedSettings,
  loading,
  saving,
  error,
  loadSettings,
  updateManySettings,
} = useSettings();

const {
  tenantTheme,
  saving: tenantSaving,
  updateBranding,
  updateSubscriptionPlan,
} = useTenantSettings();

// Active tab
const activeTab = ref('general');
const tabs = computed(() => {
  const base = [
    { key: 'general', label: t('pages.settings.tabGeneral'), icon: 'mdi-cog-outline' },
    { key: 'email', label: t('pages.settings.tabEmail'), icon: 'mdi-email-outline' },
    { key: 'storage', label: t('pages.settings.tabStorage'), icon: 'mdi-harddisk' },
    { key: 'features', label: t('pages.settings.tabFeatures'), icon: 'mdi-flag-outline' },
  ];
  if (admin.value?.is_tenant_owner) {
    base.push({ key: 'tenant', label: t('pages.settings.tabBranding'), icon: 'mdi-palette-outline' });
  }
  return base;
});

// Tenant branding form
const brandingForm = reactive({
  theme_primary_color: '',
  theme_secondary_color: '',
});
watch(tenantTheme, (theme) => {
  brandingForm.theme_primary_color = theme?.primary_color ?? '';
  brandingForm.theme_secondary_color = theme?.secondary_color ?? '';
}, { immediate: true });

const logoFile = ref<File | null>(null);
const logoInputRef = ref<HTMLInputElement | null>(null);
const onLogoInputChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  logoFile.value = input.files?.[0] ?? null;
};

const saveBranding = async () => {
  const ok = await updateBranding({
    theme_primary_color: brandingForm.theme_primary_color || undefined,
    theme_secondary_color: brandingForm.theme_secondary_color || undefined,
    logo: logoFile.value ?? undefined,
  });
  if (ok) logoFile.value = null;
};

// Subscription plan — no plan-catalog endpoint is exposed to tenant admins
// yet (only GodAdmin can list plans), so this is a raw id field for now.
const subscriptionPlanId = ref('');
const saveSubscriptionPlan = async () => {
  if (!subscriptionPlanId.value) return;
  const ok = await updateSubscriptionPlan({ subscription_plan_id: subscriptionPlanId.value });
  if (ok) subscriptionPlanId.value = '';
};

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
  tabs.value.find(t => t.key === group)?.label ?? group;

onMounted(() => loadSettings());
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">{{ t('pages.settings.title') }}</h1>
            <p class="text-body-1 text-medium-emphasis">
              {{ t('pages.settings.subtitle') }}
            </p>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Permission denied -->
    <v-row v-if="!can('setting-read')">
      <v-col cols="12">
        <v-alert type="warning" variant="tonal">
          {{ t('pages.settings.noPermission') }}
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

      <!-- Tenant branding & subscription (tenant-owner only) -->
      <v-row v-if="activeTab === 'tenant'">
        <v-col cols="12" md="7">
          <UiChildCard :title="t('pages.settings.brandingTitle')">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="brandingForm.theme_primary_color"
                  :label="t('pages.settings.primaryColor')"
                  placeholder="#112233"
                  variant="outlined"
                  density="comfortable"
                >
                  <template v-slot:prepend-inner>
                    <div class="color-swatch" :style="{ backgroundColor: brandingForm.theme_primary_color || 'transparent' }" />
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="brandingForm.theme_secondary_color"
                  :label="t('pages.settings.secondaryColor')"
                  placeholder="#445566"
                  variant="outlined"
                  density="comfortable"
                >
                  <template v-slot:prepend-inner>
                    <div class="color-swatch" :style="{ backgroundColor: brandingForm.theme_secondary_color || 'transparent' }" />
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="12">
                <input ref="logoInputRef" type="file" accept="image/*" style="display:none" @change="onLogoInputChange" />
                <div class="d-flex align-center ga-3">
                  <v-btn variant="outlined" prepend-icon="mdi-image-outline" @click="logoInputRef?.click()">
                    {{ logoFile ? logoFile.name : t('pages.settings.chooseLogo') }}
                  </v-btn>
                  <img v-if="tenantTheme?.logo_url" :src="tenantTheme.logo_url" alt="Current logo" class="current-logo" />
                </div>
              </v-col>
            </v-row>
            <v-divider class="my-4" />
            <v-btn
              color="primary"
              :loading="tenantSaving"
              prepend-icon="mdi-content-save-outline"
              @click="saveBranding"
            >
              {{ t('pages.settings.saveBranding') }}
            </v-btn>
          </UiChildCard>
        </v-col>
        <v-col cols="12" md="5">
          <UiChildCard :title="t('pages.settings.subscriptionPlanTitle')">
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ t('pages.settings.noPlanCatalog') }}
            </p>
            <v-text-field
              v-model="subscriptionPlanId"
              :label="t('pages.settings.subscriptionPlanId')"
              variant="outlined"
              density="comfortable"
              class="mb-4"
            />
            <v-btn
              color="primary"
              variant="outlined"
              :loading="tenantSaving"
              :disabled="!subscriptionPlanId"
              prepend-icon="mdi-swap-horizontal"
              @click="saveSubscriptionPlan"
            >
              {{ t('pages.settings.changePlan') }}
            </v-btn>
          </UiChildCard>
        </v-col>
      </v-row>

      <!-- Loading -->
      <v-row v-else-if="loading">
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
          <UiChildCard :title="labelForGroup(activeTab) + ' ' + t('pages.settings.settingsSuffix')">
            <!-- Empty state -->
            <div
              v-if="currentGroupSettings.length === 0"
              class="d-flex flex-column align-center justify-center py-12 text-medium-emphasis"
            >
              <v-icon size="64" class="mb-4">mdi-cog-off-outline</v-icon>
              <p>{{ t('pages.settings.noSettingsFound') }}</p>
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
                  {{ t('pages.settings.saveGroupSettings', { group: labelForGroup(activeTab) }) }}
                </v-btn>
                <v-btn
                  variant="text"
                  :disabled="saving || !hasChanges"
                  @click="resetGroup"
                >
                  {{ t('common.actions.discardChanges') }}
                </v-btn>
                <v-chip v-if="hasChanges" color="warning" variant="tonal" size="small">
                  {{ t('pages.settings.unsavedChanges') }}
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

.color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.current-logo {
  max-height: 48px;
  max-width: 160px;
  object-fit: contain;
  display: block;
}
</style>
