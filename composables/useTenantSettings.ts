import type { UpdateTenantBrandingRequest, UpdateSubscriptionPlanRequest } from '~/types/api';
import { TenantService } from '~/services/TenantService';

// Tenant-owner-only actions (branding + subscription plan) — distinct from
// useTenantTheme, which only *reads* the public branding for display.
export const useTenantSettings = () => {
  // See useTenantTheme.ts — must be constructed inside the composable, not
  // at module scope, since it needs a live Nuxt context for useRuntimeConfig().
  const tenantService = new TenantService();
  const saving = ref(false);
  const error = ref<string | null>(null);

  const notification = useNotification();
  const { tenantTheme, loadTenantTheme } = useTenantTheme();

  const updateBranding = async (data: UpdateTenantBrandingRequest): Promise<boolean> => {
    saving.value = true;
    error.value = null;
    try {
      const result = await tenantService.updateBranding(data);
      if (result.success) {
        notification.success('Branding updated successfully');
        // Force a re-fetch so the new colors/logo apply immediately.
        await loadTenantTheme(true);
        return true;
      }
      error.value = result.error || 'Failed to update branding';
      notification.error(error.value);
      return false;
    } finally {
      saving.value = false;
    }
  };

  const updateSubscriptionPlan = async (data: UpdateSubscriptionPlanRequest): Promise<boolean> => {
    saving.value = true;
    error.value = null;
    try {
      const result = await tenantService.updateSubscriptionPlan(data);
      if (result.success) {
        notification.success('Subscription plan updated successfully');
        return true;
      }
      error.value = result.error || 'Failed to update subscription plan';
      notification.error(error.value);
      return false;
    } finally {
      saving.value = false;
    }
  };

  return {
    tenantTheme,
    saving: readonly(saving),
    error: readonly(error),
    updateBranding,
    updateSubscriptionPlan,
  };
};
