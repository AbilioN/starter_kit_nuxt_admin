import type { Setting, PublicSettings, SettingGroup } from '~/types/api';
import { SettingsService } from '~/services/SettingsService';

export const useSettings = () => {
  // Constructed here, not at module scope — SettingsService's ApiClient
  // calls getApiConfig() -> useRuntimeConfig(), which needs a live Nuxt context.
  const settingsService = new SettingsService();
  const settings = useState<Setting[]>('settings', () => []);
  const publicSettings = useState<PublicSettings>('publicSettings', () => ({}));
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);

  const notification = useNotification();

  const groupedSettings = computed<Record<string, Setting[]>>(() => {
    const groups: Record<string, Setting[]> = {};
    for (const setting of settings.value) {
      if (!groups[setting.group]) groups[setting.group] = [];
      groups[setting.group].push(setting);
    }
    return groups;
  });

  const featureFlags = computed(() =>
    settings.value.filter(s => s.group === 'features')
  );

  const isFeatureEnabled = (feature: string): boolean => {
    const key = feature.includes('.') ? feature : `features.${feature}`;

    const setting = settings.value.find(s => s.key === key);
    if (setting !== undefined) {
      return setting.value === true || setting.value === 'true' || setting.value === '1' || setting.value === 1;
    }

    // Fallback to public settings (nested object: { features: { chat: true } })
    const [group, name] = key.split('.');
    if (group && name && publicSettings.value[group]) {
      return !!publicSettings.value[group][name];
    }

    return false;
  };

  const loadPublicSettings = async (): Promise<void> => {
    try {
      publicSettings.value = await settingsService.getPublicSettings();
    } catch {
      // Non-critical — silent fail so login page isn't blocked
    }
  };

  const loadSettings = async (group?: SettingGroup): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      const data = await settingsService.getSettings(group);
      if (group) {
        const others = settings.value.filter(s => s.group !== group);
        settings.value = [...others, ...data];
      } else {
        settings.value = data;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load settings';
    } finally {
      loading.value = false;
    }
  };

  const updateSetting = async (key: string, value: Setting['value']): Promise<boolean> => {
    try {
      const updated = await settingsService.updateSetting(key, value);
      const idx = settings.value.findIndex(s => s.key === key);
      if (idx !== -1) {
        settings.value = [
          ...settings.value.slice(0, idx),
          updated,
          ...settings.value.slice(idx + 1),
        ];
      }
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update setting';
      return false;
    }
  };

  const updateManySettings = async (
    items: Array<{ key: string; value: Setting['value'] }>
  ): Promise<boolean> => {
    saving.value = true;
    error.value = null;
    try {
      const updated = await settingsService.updateManySettings(items);
      const updatedMap = new Map(updated.map(s => [s.key, s]));
      settings.value = settings.value.map(s => updatedMap.get(s.key) ?? s);
      notification.success('Settings saved successfully');
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save settings';
      notification.error(error.value);
      return false;
    } finally {
      saving.value = false;
    }
  };

  return {
    settings: readonly(settings),
    publicSettings: readonly(publicSettings),
    groupedSettings,
    featureFlags,
    loading,
    saving,
    error,
    loadSettings,
    loadPublicSettings,
    updateSetting,
    updateManySettings,
    isFeatureEnabled,
  };
};
