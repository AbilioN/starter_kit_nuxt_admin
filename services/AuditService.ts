import type { 
  AuditLogsResponse,
  AuditLogResponse,
  AuditLog,
  AuditLogFilters,
  ApiResponse
} from '~/types/api';
import { AuditRepository } from '~/infrastructure/repositories/AuditRepository';

export class AuditService {
  private auditRepository: AuditRepository;

  constructor() {
    this.auditRepository = new AuditRepository();
  }

  /**
   * Lista todos os logs de auditoria com filtros opcionais
   */
  async getLogs(filters?: AuditLogFilters): Promise<ApiResponse<AuditLogsResponse>> {
    try {
      const response = await this.auditRepository.getLogs(filters);
      
      return {
        success: response.success,
        data: response,
        message: 'Audit logs loaded successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Retorna um log de auditoria específico por ID
   */
  async getLogById(id: number): Promise<ApiResponse<AuditLog>> {
    try {
      const response = await this.auditRepository.getLogById(id);
      
      return {
        success: response.success,
        data: response.data,
        message: 'Audit log loaded successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Retorna todo o histórico de mudanças de um modelo específico
   */
  async getModelHistory(modelType: string, modelId: number): Promise<ApiResponse<AuditLog[]>> {
    try {
      const response = await this.auditRepository.getModelHistory(modelType, modelId);
      
      return {
        success: response.success,
        data: response.data,
        message: 'Model history loaded successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Retorna todas as ações realizadas por um usuário específico
   */
  async getUserActivity(
    userType: 'Admin' | 'User', 
    userId: number, 
    page: number = 1, 
    perPage: number = 50
  ): Promise<ApiResponse<AuditLogsResponse>> {
    try {
      const response = await this.auditRepository.getUserActivity(userType, userId, page, perPage);
      
      return {
        success: response.success,
        data: response,
        message: 'User activity loaded successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Retorna todos os logs de uma ação específica
   */
  async getLogsByAction(
    action: string, 
    page: number = 1, 
    perPage: number = 50
  ): Promise<ApiResponse<AuditLogsResponse>> {
    try {
      const response = await this.auditRepository.getLogsByAction(action, page, perPage);
      
      return {
        success: response.success,
        data: response,
        message: 'Logs by action loaded successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Retorna todos os logs com uma tag específica
   */
  async getLogsByTag(
    tag: string, 
    page: number = 1, 
    perPage: number = 50
  ): Promise<ApiResponse<AuditLogsResponse>> {
    try {
      const response = await this.auditRepository.getLogsByTag(tag, page, perPage);
      
      return {
        success: response.success,
        data: response,
        message: 'Logs by tag loaded successfully'
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

