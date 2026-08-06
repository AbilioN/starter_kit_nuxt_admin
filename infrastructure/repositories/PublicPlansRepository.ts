import { getLandlordApiConfig, API_CONFIG } from '~/config/api';
import type {
  PublicSubscriptionPlan,
  PublicSubscriptionPlansResponse,
  PublicSubscriptionPlanResponse,
  PublicSignupRequest,
  PublicSignupResult,
  PublicSignupResponse,
} from '~/types/api';

// No tenant, no auth token — plain $fetch against the landlord-level public
// API, same pattern TenantRepository.getTheme() uses for its own public
// (but tenant-scoped) endpoint.
export class PublicPlansRepository {
  private publicBaseURL = getLandlordApiConfig().publicBaseURL;

  async listPlans(): Promise<PublicSubscriptionPlan[]> {
    const url = `${this.publicBaseURL}${API_CONFIG.ENDPOINTS.PUBLIC_SUBSCRIPTION_PLANS}`;
    const response = await $fetch<PublicSubscriptionPlansResponse>(url, { timeout: 5000 });
    return response.data;
  }

  async getPlan(slug: string): Promise<PublicSubscriptionPlan | null> {
    const url = `${this.publicBaseURL}${API_CONFIG.ENDPOINTS.PUBLIC_SUBSCRIPTION_PLANS}/${encodeURIComponent(slug)}`;
    try {
      const response = await $fetch<PublicSubscriptionPlanResponse>(url, { timeout: 5000 });
      return response.data;
    } catch {
      return null;
    }
  }

  async signup(data: PublicSignupRequest): Promise<PublicSignupResult> {
    const url = `${this.publicBaseURL}${API_CONFIG.ENDPOINTS.PUBLIC_SIGNUP}`;
    const response = await $fetch<PublicSignupResponse>(url, {
      method: 'POST',
      body: data,
      timeout: 10000,
    });
    return response.data;
  }
}
