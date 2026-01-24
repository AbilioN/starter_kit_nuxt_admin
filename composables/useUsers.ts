import type { User, UsersResponse, Pagination } from '~/types/api';
import { AuthService } from '~/services/AuthService';

export const useUsers = () => {
  // Estados reativos
  const users = ref<User[]>([]);
  const pagination = ref<Pagination | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Instância do serviço
  const authService = new AuthService();

  // Função para carregar usuários
  const loadUsers = async (page: number = 1, perPage: number = 15) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await authService.getUsers(page, perPage);
      
      if (result.success && result.data) {
        users.value = result.data.users;
        pagination.value = result.data.pagination;
      } else {
        error.value = result.error || 'Failed to load users';
      }
    } catch (err) {
      error.value = 'Unexpected error loading users';
    } finally {
      loading.value = false;
    }
  };

  // Função para ir para próxima página
  const nextPage = () => {
    if (pagination.value && pagination.value.current_page < pagination.value.last_page) {
      loadUsers(pagination.value.current_page + 1, pagination.value.per_page);
    }
  };

  // Função para ir para página anterior
  const prevPage = () => {
    if (pagination.value && pagination.value.current_page > 1) {
      loadUsers(pagination.value.current_page - 1, pagination.value.per_page);
    }
  };

  // Função para ir para página específica
  const goToPage = (page: number) => {
    if (pagination.value && page >= 1 && page <= pagination.value.last_page) {
      loadUsers(page, pagination.value.per_page);
    }
  };

  // Função para alterar itens por página
  const changePerPage = (perPage: number) => {
    loadUsers(1, perPage);
  };

  // Função para formatar dados do usuário para exibição
  const formatUserForDisplay = (user: User) => {
    return {
      ...user,
      // Dados fictícios para campos que não existem na API
      role: 'User', // Valor padrão
      status: user.email_verified_at ? 'Ativo' : 'Pendente',
      statusColor: user.email_verified_at ? 'success' : 'warning',
      avatar: `/images/profile/user-${(user.id % 8) + 1}.jpg`, // Avatar baseado no ID
      phone: `+55 (11) ${String(user.id).padStart(5, '0')}-${String(user.id).padStart(4, '0')}`,
      department: 'TI', // Valor padrão
      lastLogin: user.email_verified_at ? user.updated_at : 'Nunca'
    };
  };

  // Computed para usuários formatados
  const formattedUsers = computed(() => {
    return users.value.map(formatUserForDisplay);
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

  return {
    // Estados
    users: readonly(users),
    pagination: readonly(pagination),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    formattedUsers,
    canGoNext,
    canGoPrev,
    pageNumbers,
    
    // Funções
    loadUsers,
    nextPage,
    prevPage,
    goToPage,
    changePerPage,
    formatUserForDisplay
  };
}; 