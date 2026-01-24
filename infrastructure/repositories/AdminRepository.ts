import type {
  AdminsResponse,
  CreateAdminRequest,
  UpdateAdminRequest,
  DeleteAdminRequest,
  AdminResponse,
  AdminsListResponse
} from '~/types/api';
import { ApiClient } from '../http/ApiClient';

export class AdminRepository {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  async getAdmins(page: number = 1, perPage: number = 15): Promise<AdminsListResponse> {
    try {
      const response = await this.apiClient.get<AdminsListResponse>(`/admins?page=${page}&per_page=${perPage}`);
      return response;
    } catch (error) {
      console.error('Get admins failed:', error);
      throw new Error('Failed to fetch administrators');
    }
  }

  async createAdmin(data: CreateAdminRequest): Promise<AdminResponse> {
    try {
      const response = await this.apiClient.post<AdminResponse>('/admins', data);
      return response;
    } catch (error) {
      console.error('Create admin failed:', error);
      throw new Error('Failed to create admin');
    }
  }

  async updateAdmin(data: UpdateAdminRequest): Promise<AdminResponse> {
    try {
      const response = await this.apiClient.put<AdminResponse>('/admins', data);
      return response;
    } catch (error) {
      console.error('Update admin failed:', error);
      throw new Error('Failed to update admin');
    }
  }

  async deleteAdmin(data: DeleteAdminRequest): Promise<{ success: boolean }> {
    try {
      // DELETE request with body
      const response = await this.apiClient.deleteWithBody<{ success: boolean }>('/admins', data);
      return response;
    } catch (error) {
      console.error('Delete admin failed:', error);
      throw new Error('Failed to delete admin');
    }
  }
}
