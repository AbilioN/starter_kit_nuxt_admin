import type { Permission } from '~/types/api';
import { AuthService } from '~/services/AuthService';

export const useAvailablePermissions = () => {
  // Estados reativos
  const permissions = ref<Permission[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Instância do serviço
  const authService = new AuthService();

  // Função para carregar permissions
  const loadPermissions = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await authService.getPermissions();
      
      if (result.success && result.data) {
        permissions.value = result.data;
      } else {
        error.value = result.error || 'Failed to load permissions';
      }
    } catch (err) {
      error.value = 'Unexpected error loading permissions';
    } finally {
      loading.value = false;
    }
  };

  // Função para agrupar permissões por recurso
  const getPermissionsByResource = () => {
    const grouped: Record<string, Permission[]> = {};
    
    permissions.value.forEach(permission => {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = [];
      }
      grouped[permission.resource].push(permission);
    });
    
    return grouped;
  };

  // Computed para permissões agrupadas
  const groupedPermissions = computed(() => getPermissionsByResource());

  // Função para formatar nome do recurso
  const formatResourceName = (resource: string): string => {
    const resourceNames: Record<string, string> = {
      'admin': 'Administradores',
      'user': 'Usuários',
      'role': 'Roles',
      'chat': 'Chat',
    };
    return resourceNames[resource] || resource;
  };

  return {
    // Estados
    permissions: readonly(permissions),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    groupedPermissions,
    
    // Funções
    loadPermissions,
    getPermissionsByResource,
    formatResourceName
  };
};
