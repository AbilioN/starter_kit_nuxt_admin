import type { Role, RolesResponse } from '~/types/api';
import { AuthService } from '~/services/AuthService';

export const useRoles = () => {
  // Estados reativos
  const roles = ref<Role[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Instância do serviço
  const authService = new AuthService();

  // Função para carregar roles
  const loadRoles = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await authService.getRoles();
      
      if (result.success && result.data) {
        roles.value = result.data;
      } else {
        error.value = result.error || 'Failed to load roles';
      }
    } catch (err) {
      error.value = 'Unexpected error loading roles';
    } finally {
      loading.value = false;
    }
  };

  // Funções de paginação removidas - a API retorna todos os roles de uma vez

  // Função para formatar dados do role para exibição
  const formatRoleForDisplay = (role: Role) => {
    return {
      ...role,
      // Dados para exibição
      permissionsCount: role.permissions ? role.permissions.length : 0,
      createdDate: new Date(role.created_at).toLocaleDateString('pt-BR'),
      lastModified: new Date(role.updated_at).toLocaleDateString('pt-BR'),
      status: role.is_active ? 'Ativo' : 'Inativo',
      statusColor: role.is_active ? 'success' : 'error',
    };
  };

  // Computed para roles formatados
  const formattedRoles = computed(() => {
    return roles.value.map(formatRoleForDisplay);
  });

  return {
    // Estados
    roles: readonly(roles),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    formattedRoles,
    
    // Funções
    loadRoles,
    formatRoleForDisplay
  };
};
