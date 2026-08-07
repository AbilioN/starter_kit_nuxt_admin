import { useTheme } from 'vuetify';
import type { TenantTheme } from '~/types/api';
import { TenantService } from '~/services/TenantService';

// Shared across the whole app so every page reuses one fetch instead of
// re-requesting the (public, unauthenticated) tenant theme endpoint.
export const useTenantTheme = () => {
  // Constructed here (not at module scope) — its constructor chain reaches
  // getApiConfig(), which calls useRuntimeConfig() and therefore needs a
  // live Nuxt/Vue context, unavailable at module-import time.
  const tenantService = new TenantService();
  const tenantTheme = useState<TenantTheme | null>('tenantTheme', () => null);
  const loading = useState<boolean>('tenantThemeLoading', () => false);

  const vuetifyTheme = useTheme();

  const applyBrandColors = (data: TenantTheme) => {
    const activeName = vuetifyTheme.global.name.value;
    const activeTheme = vuetifyTheme.themes.value[activeName];
    if (!activeTheme) return;

    if (data.primary_color) activeTheme.colors.primary = data.primary_color;
    if (data.secondary_color) activeTheme.colors.secondary = data.secondary_color;
  };

  const loadTenantTheme = async (force = false): Promise<void> => {
    if ((tenantTheme.value && !force) || loading.value) return;
    loading.value = true;
    try {
      const result = await tenantService.getTheme();
      if (result.success && result.data) {
        tenantTheme.value = result.data;
        applyBrandColors(result.data);
        if (process.client && result.data.name) {
          document.title = result.data.name;
        }
      }
    } catch {
      // Non-critical — branding is a progressive enhancement, never block the app on it.
      // tenant_suspended is the one exception, but it's already intercepted
      // upstream in TenantRepository.getTheme() (hard-redirects to /suspended
      // before this catch ever sees it) — nothing left to do here for that case.
    } finally {
      loading.value = false;
    }
  };

  return {
    tenantTheme: readonly(tenantTheme),
    loading: readonly(loading),
    loadTenantTheme,
  };
};
