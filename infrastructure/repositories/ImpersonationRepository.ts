import { ApiClient } from '../http/ApiClient';
import { API_CONFIG } from '~/config/api';
import type { ImpersonationState, ImpersonationStateResponse } from '~/types/api';

export class ImpersonationRepository {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  async getState(): Promise<ImpersonationState> {
    const response = await this.apiClient.get<ImpersonationStateResponse>(API_CONFIG.ENDPOINTS.IMPERSONATION);
    return response.data;
  }

  async stop(): Promise<void> {
    await this.apiClient.post<ImpersonationStateResponse>(API_CONFIG.ENDPOINTS.IMPERSONATION_STOP);
  }
}
