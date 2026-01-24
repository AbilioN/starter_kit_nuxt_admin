import type {
  Admin,
  AdminsListResponse,
  AdminsResponse,
  ApiResponse,
  CreateAdminRequest,
  UpdateAdminRequest,
  DeleteAdminRequest
} from '~/types/api';
import { AdminRepository } from '~/infrastructure/repositories/AdminRepository';

export class AdminService {
  private adminRepository: AdminRepository;

  constructor() {
    this.adminRepository = new AdminRepository();
  }

  async getAdmins(page: number = 1, perPage: number = 15): Promise<ApiResponse<AdminsListResponse>> {
    try {
      const response = await this.adminRepository.getAdmins(page, perPage);
      
      // A API retorna { success: true, data: [...], pagination: {...} }
      return {
        success: response.success,
        data: response,
        message: 'Administrators loaded successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async createAdmin(data: CreateAdminRequest): Promise<ApiResponse<Admin>> {
    try {
      const response = await this.adminRepository.createAdmin(data);
      
      return {
        success: response.success,
        data: response.data,
        message: 'Administrator created successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async updateAdmin(data: UpdateAdminRequest): Promise<ApiResponse<Admin>> {
    try {
      const response = await this.adminRepository.updateAdmin(data);
      
      return {
        success: response.success,
        data: response.data,
        message: 'Administrator updated successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async deleteAdmin(data: DeleteAdminRequest): Promise<ApiResponse<boolean>> {
    try {
      const response = await this.adminRepository.deleteAdmin(data);
      
      return {
        success: response.success,
        data: response.success,
        message: 'Administrator deleted successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}
