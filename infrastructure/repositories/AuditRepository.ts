import type { 
  AuditLogsResponse,
  AuditLogResponse,
  AuditLogFilters
} from '~/types/api';
import { ApiClient } from '../http/ApiClient';

export class AuditRepository {
  private apiClient: ApiClient;
  private basePath = '/audit';

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * Lista todos os logs de auditoria com filtros opcionais
   */
  async getLogs(filters?: AuditLogFilters): Promise<AuditLogsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }

      const queryString = params.toString();
      const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;
      
      const response = await this.apiClient.get<AuditLogsResponse>(url);
      return response;
    } catch (error) {
      console.error('Get audit logs failed:', error);
      throw new Error('Failed to fetch audit logs');
    }
  }

  /**
   * Retorna um log de auditoria específico por ID
   */
  async getLogById(id: number): Promise<AuditLogResponse> {
    try {
      const response = await this.apiClient.get<AuditLogResponse>(`${this.basePath}/${id}`);
      return response;
    } catch (error) {
      console.error('Get audit log failed:', error);
      throw new Error('Failed to fetch audit log');
    }
  }

  /**
   * Retorna todo o histórico de mudanças de um modelo específico
   */
  async getModelHistory(modelType: string, modelId: number): Promise<AuditLogsResponse> {
    try {
      // Escapar barras invertidas para URL
      const encodedType = encodeURIComponent(modelType);
      const response = await this.apiClient.get<AuditLogsResponse>(
        `${this.basePath}/model/${encodedType}/${modelId}`
      );
      return response;
    } catch (error) {
      console.error('Get model history failed:', error);
      throw new Error('Failed to fetch model history');
    }
  }

  /**
   * Retorna todas as ações realizadas por um usuário específico
   */
  async getUserActivity(userType: 'Admin' | 'User', userId: number, page: number = 1, perPage: number = 50): Promise<AuditLogsResponse> {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', String(page));
      if (perPage) params.append('per_page', String(perPage));
      
      const queryString = params.toString();
      const url = queryString 
        ? `${this.basePath}/user/${userType}/${userId}?${queryString}`
        : `${this.basePath}/user/${userType}/${userId}`;
      
      const response = await this.apiClient.get<AuditLogsResponse>(url);
      return response;
    } catch (error) {
      console.error('Get user activity failed:', error);
      throw new Error('Failed to fetch user activity');
    }
  }

  /**
   * Retorna todos os logs de uma ação específica
   */
  async getLogsByAction(action: string, page: number = 1, perPage: number = 50): Promise<AuditLogsResponse> {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', String(page));
      if (perPage) params.append('per_page', String(perPage));
      
      const queryString = params.toString();
      const url = queryString 
        ? `${this.basePath}/action/${action}?${queryString}`
        : `${this.basePath}/action/${action}`;
      
      const response = await this.apiClient.get<AuditLogsResponse>(url);
      return response;
    } catch (error) {
      console.error('Get logs by action failed:', error);
      throw new Error('Failed to fetch logs by action');
    }
  }

  /**
   * Retorna todos os logs com uma tag específica
   */
  async getLogsByTag(tag: string, page: number = 1, perPage: number = 50): Promise<AuditLogsResponse> {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', String(page));
      if (perPage) params.append('per_page', String(perPage));
      
      const queryString = params.toString();
      const url = queryString 
        ? `${this.basePath}/tag/${tag}?${queryString}`
        : `${this.basePath}/tag/${tag}`;
      
      const response = await this.apiClient.get<AuditLogsResponse>(url);
      return response;
    } catch (error) {
      console.error('Get logs by tag failed:', error);
      throw new Error('Failed to fetch logs by tag');
    }
  }
}

