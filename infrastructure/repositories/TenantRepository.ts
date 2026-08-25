import { ApiClient } from '../http/ApiClient';
import { getApiConfig, API_CONFIG } from '~/config/api';
import { appendTenantQueryParam, isTenantSuspendedError, redirectToSuspendedPage } from '~/utils/tenant';
import type {
  TenantTheme,
  TenantThemeResponse,
  TenantBranding,
  UpdateTenantBrandingRequest,
  UpdateTenantBrandingResponse,
  UpdateSubscriptionPlanRequest,
  UpdateSubscriptionPlanResponse,
  SubscriptionHistoryResponse,
} from '~/types/api';

export class TenantRepository {
  private apiClient: ApiClient;
  private baseURL = getApiConfig().baseURL;
  private tenantQueryParam = getApiConfig().tenantQueryParam;

  constructor() {
    this.apiClient = new ApiClient();
  }

  // Public, unauthenticated — safe to call before login (still requires the
  // tenant subdomain to resolve on the backend).
  async getTheme(): Promise<TenantTheme> {
    const { publicBaseURL, tenantQueryParam } = getApiConfig();
    const url = appendTenantQueryParam(`${publicBaseURL}${API_CONFIG.ENDPOINTS.TENANT_THEME}`, tenantQueryParam);
    try {
      const response = await $fetch<TenantThemeResponse>(url, { timeout: 5000 });
      return response.data;
    } catch (error: any) {
      // This uses $fetch (ofetch) directly, not ApiClient, so it needs its
      // own tenant_suspended interception — ofetch parses the error body
      // into error.data, same shape as pages/auth/*-password.vue reads err?.data?.message.
      if (isTenantSuspendedError(error?.data)) {
        redirectToSuspendedPage();
      }
      throw error;
    }
  }

  // multipart/form-data (may carry a logo file) — PHP doesn't parse
  // multipart bodies on native PATCH, so this is a real POST with a spoofed
  // _method field, same convention FileRepository.uploadFile() uses.
  async updateBranding(data: UpdateTenantBrandingRequest): Promise<TenantBranding> {
    const token = process.client ? localStorage.getItem('auth_token') : null;
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    if (data.theme_primary_color) formData.append('theme_primary_color', data.theme_primary_color);
    if (data.theme_secondary_color) formData.append('theme_secondary_color', data.theme_secondary_color);
    if (data.theme_tertiary_color) formData.append('theme_tertiary_color', data.theme_tertiary_color);
    if (data.logo) formData.append('logo', data.logo);
    else if (data.logo_path) formData.append('logo_path', data.logo_path);

    const url = appendTenantQueryParam(`${this.baseURL}${API_CONFIG.ENDPOINTS.TENANT_BRANDING}`, this.tenantQueryParam);
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' },
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(body.message ?? `Branding update failed: ${res.status}`);
    }
    const json = await res.json() as UpdateTenantBrandingResponse;
    return json.data;
  }

  async updateSubscriptionPlan(data: UpdateSubscriptionPlanRequest): Promise<boolean> {
    const response = await this.apiClient.patch<UpdateSubscriptionPlanResponse>(
      API_CONFIG.ENDPOINTS.TENANT_SUBSCRIPTION_PLAN,
      data
    );
    return response.success;
  }

  // Tenant owner only — 403 para qualquer outro admin (middleware `tenant.owner`).
  async getSubscriptionHistory(page = 1, perPage = 15): Promise<SubscriptionHistoryResponse> {
    return this.apiClient.get<SubscriptionHistoryResponse>(
      `${API_CONFIG.ENDPOINTS.TENANT_SUBSCRIPTION_HISTORY}?page=${page}&per_page=${perPage}`
    );
  }
}
