import type {
  AdminProfile,
  AdminProfileResponse,
  ChangeAdminPasswordRequest,
  UpdateAdminProfileRequest,
} from '~/types/api';
import { ApiClient } from '../http/ApiClient';

/**
 * ATENÇÃO aos caminhos: `getApiConfig().baseURL` já termina em `/api/admin`
 * (config/api.ts), portanto aqui usa-se `/me` e NÃO `/admin/me`. A versão
 * anterior deste código vivia dentro do useProfile e duplicava o prefixo,
 * gerando `/api/admin/admin/me` → 404 em todas as chamadas.
 */
export class ProfileRepository {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  async getProfile(): Promise<AdminProfile> {
    const res = await this.apiClient.get<AdminProfileResponse>('/me');
    return res.data;
  }

  async updateProfile(data: UpdateAdminProfileRequest): Promise<AdminProfile> {
    const res = await this.apiClient.patch<AdminProfileResponse>('/me', data);
    return res.data;
  }

  async changePassword(data: ChangeAdminPasswordRequest): Promise<void> {
    await this.apiClient.patch<{ success: boolean }>('/me/password', data);
  }

  /**
   * POST real com multipart — o backend expõe `POST /me/avatar` justamente para
   * não precisar do truque `_method: PATCH` que o upload de logo usa (o PHP não
   * parseia corpos multipart num PATCH nativo).
   *
   * Timeout alargado: o default de 10s do ApiClient aborta um ficheiro de 2 MB
   * em ligação lenta e reporta erro para algo que pode ter tido sucesso.
   */
  async uploadAvatar(file: File): Promise<AdminProfile> {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await this.apiClient.postForm<AdminProfileResponse>('/me/avatar', formData, {
      timeout: 30000,
    });
    return res.data;
  }

  async removeAvatar(): Promise<AdminProfile> {
    const res = await this.apiClient.delete<AdminProfileResponse>('/me/avatar');
    return res.data;
  }
}
