import type { Admin, AdminsResponse, Pagination } from '~/types/api';
import { AdminService } from '~/services/AdminService';

export const useAdmins = () => {
  // Estados reativos
  const admins = ref<Admin[]>([]);
  const pagination = ref<Pagination | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Instância do serviço
  const adminService = new AdminService();

  // Função para carregar administradores
  const loadAdmins = async (page: number = 1, perPage: number = 15) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await adminService.getAdmins(page, perPage);
      
      if (result.success && result.data) {
        // A API retorna { success: true, data: [...], pagination: {...} }
        admins.value = result.data.data || [];
        pagination.value = result.data.pagination || null;
      } else {
        error.value = result.error || 'Failed to load administrators';
        admins.value = [];
      }
    } catch (err) {
      error.value = 'Unexpected error loading administrators';
      admins.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Função para ir para próxima página
  const nextPage = () => {
    if (pagination.value && pagination.value.current_page < pagination.value.last_page) {
      loadAdmins(pagination.value.current_page + 1, pagination.value.per_page);
    }
  };

  // Função para ir para página anterior
  const prevPage = () => {
    if (pagination.value && pagination.value.current_page > 1) {
      loadAdmins(pagination.value.current_page - 1, pagination.value.per_page);
    }
  };

  // Função para ir para página específica
  const goToPage = (page: number) => {
    if (pagination.value && page >= 1 && page <= pagination.value.last_page) {
      loadAdmins(page, pagination.value.per_page);
    }
  };

  // Função para alterar itens por página
  const changePerPage = (perPage: number) => {
    loadAdmins(1, perPage);
  };

  // Função para formatar dados do administrador para exibição
  const formatAdminForDisplay = (admin: Admin) => {
    return {
      ...admin,
      // Dados para exibição
      role: admin.is_super_admin ? 'Super Admin' : 'Admin',
      status: admin.is_active ? 'Ativo' : 'Inativo',
      statusColor: admin.is_active ? 'success' : 'error',
      avatar: `/images/profile/user-${(admin.id % 8) + 1}.jpg`, // Avatar baseado no ID
      phone: `+55 (11) ${String(admin.id).padStart(5, '0')}-${String(admin.id).padStart(4, '0')}`,
      department: 'Administração', // Valor padrão
      lastLogin: admin.last_login_at ? new Date(admin.last_login_at).toLocaleDateString('pt-BR') : 'Nunca'
    };
  };

  // Computed para administradores formatados
  const formattedAdmins = computed(() => {
    if (!admins.value || !Array.isArray(admins.value)) {
      return [];
    }
    return admins.value.map(formatAdminForDisplay);
  });

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

  // Função para criar administrador
  const createAdmin = async (data: any) => {
    try {
      const result = await adminService.createAdmin(data);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create admin'
      };
    }
  };

  // Função para atualizar administrador
  const updateAdmin = async (data: any) => {
    try {
      const result = await adminService.updateAdmin(data);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update admin'
      };
    }
  };

  // Função para deletar administrador
  const deleteAdmin = async (id: number) => {
    try {
      const result = await adminService.deleteAdmin({ id });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete admin'
      };
    }
  };

  return {
    // Estados
    admins: readonly(admins),
    pagination: readonly(pagination),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    formattedAdmins,
    canGoNext,
    canGoPrev,
    pageNumbers,
    
    // Funções
    loadAdmins,
    nextPage,
    prevPage,
    goToPage,
    changePerPage,
    formatAdminForDisplay,
    createAdmin,
    updateAdmin,
    deleteAdmin
  };
};
