import type {
  AdminProfile,
  ApiResponse,
  ChangeAdminPasswordRequest,
  UpdateAdminProfileRequest,
} from '~/types/api';
import { ProfileRepository } from '~/infrastructure/repositories/ProfileRepository';

export class ProfileService {
  private profileRepository: ProfileRepository;

  constructor() {
    this.profileRepository = new ProfileRepository();
  }

  async getProfile(): Promise<ApiResponse<AdminProfile>> {
    try {
      const data = await this.profileRepository.getProfile();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateProfile(data: UpdateAdminProfileRequest): Promise<ApiResponse<AdminProfile>> {
    try {
      const result = await this.profileRepository.updateProfile(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async changePassword(data: ChangeAdminPasswordRequest): Promise<ApiResponse<boolean>> {
    try {
      await this.profileRepository.changePassword(data);
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async uploadAvatar(file: File): Promise<ApiResponse<AdminProfile>> {
    try {
      const data = await this.profileRepository.uploadAvatar(file);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async removeAvatar(): Promise<ApiResponse<AdminProfile>> {
    try {
      const data = await this.profileRepository.removeAvatar();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
