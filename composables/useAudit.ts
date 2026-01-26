import type { AuditLog, AuditLogFilters, Pagination } from '~/types/api';
import { AuditService } from '~/services/AuditService';

export const useAudit = () => {
  // Estados reativos
  const logs = ref<AuditLog[]>([]);
  const pagination = ref<Pagination | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const selectedLog = ref<AuditLog | null>(null);
  
  // Instância do serviço
  const auditService = new AuditService();

  // Função para carregar logs com filtros
  const loadLogs = async (filters?: AuditLogFilters) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await auditService.getLogs(filters);
      
      if (result.success && result.data) {
        logs.value = result.data.data;
        pagination.value = result.data.pagination;
      } else {
        error.value = result.error || 'Failed to load audit logs';
      }
    } catch (err) {
      error.value = 'Unexpected error loading audit logs';
    } finally {
      loading.value = false;
    }
  };

  // Função para carregar um log específico
  const loadLogById = async (id: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await auditService.getLogById(id);
      
      if (result.success && result.data) {
        selectedLog.value = result.data;
        return result.data;
      } else {
        error.value = result.error || 'Failed to load audit log';
        return null;
      }
    } catch (err) {
      error.value = 'Unexpected error loading audit log';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Função para carregar histórico de um modelo
  const loadModelHistory = async (modelType: string, modelId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await auditService.getModelHistory(modelType, modelId);
      
      if (result.success && result.data) {
        logs.value = result.data;
        return result.data;
      } else {
        error.value = result.error || 'Failed to load model history';
        return [];
      }
    } catch (err) {
      error.value = 'Unexpected error loading model history';
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Função para carregar atividade de um usuário
  const loadUserActivity = async (
    userType: 'Admin' | 'User',
    userId: number,
    page: number = 1,
    perPage: number = 50
  ) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await auditService.getUserActivity(userType, userId, page, perPage);
      
      if (result.success && result.data) {
        logs.value = result.data.data;
        pagination.value = result.data.pagination;
      } else {
        error.value = result.error || 'Failed to load user activity';
      }
    } catch (err) {
      error.value = 'Unexpected error loading user activity';
    } finally {
      loading.value = false;
    }
  };

  // Função para carregar logs por ação
  const loadLogsByAction = async (action: string, page: number = 1, perPage: number = 50) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await auditService.getLogsByAction(action, page, perPage);
      
      if (result.success && result.data) {
        logs.value = result.data.data;
        pagination.value = result.data.pagination;
      } else {
        error.value = result.error || 'Failed to load logs by action';
      }
    } catch (err) {
      error.value = 'Unexpected error loading logs by action';
    } finally {
      loading.value = false;
    }
  };

  // Função para carregar logs por tag
  const loadLogsByTag = async (tag: string, page: number = 1, perPage: number = 50) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await auditService.getLogsByTag(tag, page, perPage);
      
      if (result.success && result.data) {
        logs.value = result.data.data;
        pagination.value = result.data.pagination;
      } else {
        error.value = result.error || 'Failed to load logs by tag';
      }
    } catch (err) {
      error.value = 'Unexpected error loading logs by tag';
    } finally {
      loading.value = false;
    }
  };

  // Funções de paginação
  const nextPage = (filters?: AuditLogFilters) => {
    if (pagination.value && pagination.value.current_page < pagination.value.last_page) {
      const newFilters = {
        ...filters,
        page: pagination.value.current_page + 1,
        per_page: pagination.value.per_page
      };
      loadLogs(newFilters);
    }
  };

  const prevPage = (filters?: AuditLogFilters) => {
    if (pagination.value && pagination.value.current_page > 1) {
      const newFilters = {
        ...filters,
        page: pagination.value.current_page - 1,
        per_page: pagination.value.per_page
      };
      loadLogs(newFilters);
    }
  };

  const goToPage = (page: number, filters?: AuditLogFilters) => {
    if (pagination.value && page >= 1 && page <= pagination.value.last_page) {
      const newFilters = {
        ...filters,
        page,
        per_page: pagination.value.per_page
      };
      loadLogs(newFilters);
    }
  };

  const changePerPage = (perPage: number, filters?: AuditLogFilters) => {
    const newFilters = {
      ...filters,
      page: 1,
      per_page: perPage
    };
    loadLogs(newFilters);
  };

  // Computed para verificar se pode ir para próxima página
  const canGoNext = computed(() => {
    return pagination.value && pagination.value.current_page < pagination.value.last_page;
  });

  // Computed para verificar se pode ir para página anterior
  const canGoPrev = computed(() => {
    return pagination.value && pagination.value.current_page > 1;
  });

  // Computed para array de páginas
  const pageNumbers = computed(() => {
    if (!pagination.value) return [];
    
    const pages = [];
    const current = pagination.value.current_page;
    const last = pagination.value.last_page;
    
    // Mostrar até 5 páginas
    let start = Math.max(1, current - 2);
    let end = Math.min(last, current + 2);
    
    // Ajustar se estamos no início ou fim
    if (current <= 3) {
      end = Math.min(last, 5);
    } else if (current >= last - 2) {
      start = Math.max(1, last - 4);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  });

  // Função para formatar data
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para obter cor da ação
  const getActionColor = (action: string): string => {
    switch (action) {
      case 'created':
        return 'success';
      case 'updated':
        return 'info';
      case 'deleted':
        return 'error';
      case 'login':
        return 'primary';
      default:
        return 'default';
    }
  };

  // Função para obter ícone da ação
  const getActionIcon = (action: string): string => {
    switch (action) {
      case 'created':
        return 'mdi-plus-circle';
      case 'updated':
        return 'mdi-pencil';
      case 'deleted':
        return 'mdi-delete';
      case 'login':
        return 'mdi-login';
      default:
        return 'mdi-information';
    }
  };

  // Função para obter nome do modelo (sem namespace)
  const getModelName = (modelType: string): string => {
    return modelType.split('\\').pop() || modelType;
  };

  return {
    // Estados
    logs: readonly(logs),
    pagination: readonly(pagination),
    loading: readonly(loading),
    error: readonly(error),
    selectedLog: readonly(selectedLog),
    
    // Computed
    canGoNext,
    canGoPrev,
    pageNumbers,
    
    // Funções
    loadLogs,
    loadLogById,
    loadModelHistory,
    loadUserActivity,
    loadLogsByAction,
    loadLogsByTag,
    nextPage,
    prevPage,
    goToPage,
    changePerPage,
    formatDate,
    getActionColor,
    getActionIcon,
    getModelName
  };
};

