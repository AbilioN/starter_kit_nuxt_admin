import { ApiClient } from '../http/ApiClient';
import { getApiConfig, API_CONFIG } from '~/config/api';
import { appendTenantQueryParam } from '~/utils/tenant';
import type {
  TenantTheme,
  TenantThemeResponse,
  TenantBranding,
  UpdateTenantBrandingRequest,
  UpdateTenantBrandingResponse,
  UpdateSubscriptionPlanRequest,
  UpdateSubscriptionPlanResponse,
} from '~/types/api';

export class TenantRepository {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  // Public, unauthenticated — safe to call before login (still requires the
  // tenant subdomain to resolve on the backend).
  async getTheme(): Promise<TenantTheme> {
    const { publicBaseURL, tenantQueryParam } = getApiConfig();
    const url = appendTenantQueryParam(`${publicBaseURL}${API_CONFIG.ENDPOINTS.TENANT_THEME}`, tenantQueryParam);
    const response = await $fetch<TenantThemeResponse>(url, { timeout: 5000 });
    return response.data;
  }

  async updateBranding(data: UpdateTenantBrandingRequest): Promise<TenantBranding> {
    const response = await this.apiClient.patch<UpdateTenantBrandingResponse>(
      API_CONFIG.ENDPOINTS.TENANT_BRANDING,
      data
    );
    return response.data;
  }

  async updateSubscriptionPlan(data: UpdateSubscriptionPlanRequest): Promise<boolean> {
    const response = await this.apiClient.patch<UpdateSubscriptionPlanResponse>(
      API_CONFIG.ENDPOINTS.TENANT_SUBSCRIPTION_PLAN,
      data
    );
    return response.success;
  }
}
