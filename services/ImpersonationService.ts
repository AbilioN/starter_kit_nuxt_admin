import type { ApiResponse, ImpersonationState } from '~/types/api';
import { ImpersonationRepository } from '~/infrastructure/repositories/ImpersonationRepository';

export class ImpersonationService {
  private impersonationRepository: ImpersonationRepository;

  constructor() {
    this.impersonationRepository = new ImpersonationRepository();
  }

  async getState(): Promise<ApiResponse<ImpersonationState>> {
    try {
      const data = await this.impersonationRepository.getState();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async stop(): Promise<ApiResponse<boolean>> {
    try {
      await this.impersonationRepository.stop();
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
