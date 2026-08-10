import type {
  ApiResponse,
  TenantTheme,
  TenantBranding,
  UpdateTenantBrandingRequest,
  UpdateSubscriptionPlanRequest,
  SubscriptionHistoryResponse,
} from '~/types/api';
import { TenantRepository } from '~/infrastructure/repositories/TenantRepository';

export class TenantService {
  private tenantRepository: TenantRepository;

  constructor() {
    this.tenantRepository = new TenantRepository();
  }

  async getTheme(): Promise<ApiResponse<TenantTheme>> {
    try {
      const data = await this.tenantRepository.getTheme();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateBranding(data: UpdateTenantBrandingRequest): Promise<ApiResponse<TenantBranding>> {
    try {
      const result = await this.tenantRepository.updateBranding(data);
      return { success: true, data: result, message: 'Branding updated successfully' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateSubscriptionPlan(data: UpdateSubscriptionPlanRequest): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.tenantRepository.updateSubscriptionPlan(data);
      return { success: true, data: result, message: 'Subscription plan updated successfully' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getSubscriptionHistory(page = 1, perPage = 15): Promise<ApiResponse<SubscriptionHistoryResponse>> {
    try {
      const data = await this.tenantRepository.getSubscriptionHistory(page, perPage);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
