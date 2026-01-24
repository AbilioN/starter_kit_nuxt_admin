import type { IAuthService } from '~/types/domain';
import type { 
  LoginResponse, 
  Admin, 
  ApiResponse, 
  UsersResponse, 
  RolesResponse, 
  PermissionsResponse, 
  Permission,
  CreateRoleRequest,
  UpdateRoleRequest,
  DeleteRoleRequest,
  UpdateRolePermissionsRequest,
  RoleResponse,
  Role
} from '~/types/api';
import { AuthRepository } from '~/infrastructure/repositories/AuthRepository';

export class AuthService implements IAuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await this.authRepository.login(email, password);
      
      // Salvar token no localStorage
      this.setToken(response.token);
      
      return {
        success: true,
        data: response,
        message: 'Login successful'
      };
    } catch (error) {
      // Capturar a mensagem específica de erro da API
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authRepository.logout();
    } finally {
      // Sempre limpar o token local, mesmo se a API falhar
      this.clearToken();
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    if (process.client) {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  setToken(token: string): void {
    if (process.client) {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken(): void {
    if (process.client) {
      localStorage.removeItem('auth_token');
    }
  }

  async getCurrentUser(): Promise<Admin | null> {
    if (!this.isAuthenticated()) {
      return null;
    }
    
    return await this.authRepository.getCurrentUser();
  }

  async getUsers(page: number = 1, perPage: number = 15): Promise<ApiResponse<UsersResponse>> {
    try {
      const response = await this.authRepository.getUsers(page, perPage);
      
      return {
        success: true,
        data: response,
        message: 'Users loaded successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getRoles(): Promise<ApiResponse<RolesResponse>> {
    try {
      const response = await this.authRepository.getRoles();
      
      return {
        success: true,
        data: response,
        message: 'Roles loaded successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getPermissions(): Promise<ApiResponse<Permission[]>> {
    try {
      const response = await this.authRepository.getPermissions();
      
      return {
        success: response.success,
        data: response.data,
        message: 'Permissions loaded successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async createRole(data: CreateRoleRequest): Promise<ApiResponse<Role>> {
    try {
      const response = await this.authRepository.createRole(data);
      
      return {
        success: response.success,
        data: response.data.role,
        message: 'Role created successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async updateRole(data: UpdateRoleRequest): Promise<ApiResponse<Role>> {
    try {
      const response = await this.authRepository.updateRole(data);
      
      return {
        success: response.success,
        data: response.data.role,
        message: 'Role updated successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async deleteRole(data: DeleteRoleRequest): Promise<ApiResponse<boolean>> {
    try {
      const response = await this.authRepository.deleteRole(data);
      
      return {
        success: response.success,
        data: response.success,
        message: 'Role deleted successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async updateRolePermissions(data: UpdateRolePermissionsRequest): Promise<ApiResponse<Role>> {
    try {
      const response = await this.authRepository.updateRolePermissions(data);
      
      return {
        success: response.success,
        data: response.data.role,
        message: 'Permissions updated successfully'
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