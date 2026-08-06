import type { ApiResponse, PublicSubscriptionPlan, PublicSignupRequest, PublicSignupResult } from '~/types/api';
import { PublicPlansRepository } from '~/infrastructure/repositories/PublicPlansRepository';

export class PublicPlansService {
  private publicPlansRepository: PublicPlansRepository;

  constructor() {
    this.publicPlansRepository = new PublicPlansRepository();
  }

  async listPlans(): Promise<ApiResponse<PublicSubscriptionPlan[]>> {
    try {
      const data = await this.publicPlansRepository.listPlans();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getPlan(slug: string): Promise<ApiResponse<PublicSubscriptionPlan>> {
    try {
      const data = await this.publicPlansRepository.getPlan(slug);
      if (!data) {
        return { success: false, error: 'Plan not found' };
      }
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async signup(data: PublicSignupRequest): Promise<ApiResponse<PublicSignupResult>> {
    try {
      const result = await this.publicPlansRepository.signup(data);
      return { success: true, data: result };
    } catch (error) {
      // $fetch (ofetch) throws with the parsed Laravel error body on .data —
      // same pattern already used in pages/auth/forgot-password.vue.
      const fetchError = error as { data?: { message?: string; errors?: Record<string, string[]> } };
      const firstValidationError = fetchError?.data?.errors
        ? Object.values(fetchError.data.errors)[0]?.[0]
        : undefined;

      return {
        success: false,
        error: fetchError?.data?.message ?? firstValidationError ?? (error instanceof Error ? error.message : 'Signup failed'),
      };
    }
  }
}
