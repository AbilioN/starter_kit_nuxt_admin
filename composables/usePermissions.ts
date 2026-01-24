import type { Permission, Role } from '~/types/api';

export const usePermissions = () => {
  // Estado reativo das permissões
  const permissions = useState<Permission[]>('permissions', () => [])
  
  // Estado reativo dos roles
  const roles = useState<Role[]>('roles', () => [])
  
  // Estado reativo do status de super admin
  const isSuperAdmin = useState<boolean>('isSuperAdmin', () => false)

  // Função para verificar se o usuário tem uma permissão específica
  const hasPermission = (permissionSlug: string): boolean => {
    if (isSuperAdmin.value) {
      return true; // Super admin tem todas as permissões
    }
    
    return permissions.value.some(permission => 
      permission.slug === permissionSlug && permission.is_active
    )
  }

  // Função para verificar se o usuário tem permissão para um recurso e ação específicos
  const canAccess = (resource: string, action: string): boolean => {
    if (isSuperAdmin.value) {
      return true; // Super admin tem acesso a tudo
    }
    
    return permissions.value.some(permission => 
      permission.resource === resource && 
      permission.action === action && 
      permission.is_active
    )
  }

  // Função para verificar múltiplas permissões (AND)
  const hasAllPermissions = (permissionSlugs: string[]): boolean => {
    if (isSuperAdmin.value) {
      return true;
    }
    
    return permissionSlugs.every(slug => hasPermission(slug))
  }

  // Função para verificar se tem pelo menos uma das permissões (OR)
  const hasAnyPermission = (permissionSlugs: string[]): boolean => {
    if (isSuperAdmin.value) {
      return true;
    }
    
    return permissionSlugs.some(slug => hasPermission(slug))
  }

  // Função para obter permissões por recurso
  const getPermissionsByResource = (resource: string): Permission[] => {
    return permissions.value.filter(permission => 
      permission.resource === resource && permission.is_active
    )
  }

  // Função para obter permissões por ação
  const getPermissionsByAction = (action: string): Permission[] => {
    return permissions.value.filter(permission => 
      permission.action === action && permission.is_active
    )
  }

  // Função para extrair permissões de roles
  const extractPermissionsFromRoles = (roles: Role[]): Permission[] => {
    const allPermissions: Permission[] = []
    
    roles.forEach(role => {
      if (role.permissions) {
        allPermissions.push(...role.permissions)
      }
    })
    
    // Remover duplicatas baseado no ID
    const uniquePermissions = allPermissions.filter((permission, index, self) => 
      index === self.findIndex(p => p.id === permission.id)
    )
    
    return uniquePermissions
  }

  // Função para definir roles e permissões (usada após login)
  const setRoles = (newRoles: Role[], superAdminStatus: boolean) => {
    roles.value = newRoles
    isSuperAdmin.value = superAdminStatus
    
    // Extrair permissões dos roles
    permissions.value = extractPermissionsFromRoles(newRoles)
    
    // Salvar no localStorage
    if (process.client) {
      localStorage.setItem('roles', JSON.stringify(newRoles))
      localStorage.setItem('permissions', JSON.stringify(permissions.value))
      localStorage.setItem('isSuperAdmin', JSON.stringify(superAdminStatus))
    }
  }

  // Função para definir permissões diretamente (compatibilidade)
  const setPermissions = (newPermissions: Permission[], superAdminStatus: boolean) => {
    permissions.value = newPermissions
    isSuperAdmin.value = superAdminStatus
    
    // Salvar no localStorage
    if (process.client) {
      localStorage.setItem('permissions', JSON.stringify(newPermissions))
      localStorage.setItem('isSuperAdmin', JSON.stringify(superAdminStatus))
    }
  }

  // Função para limpar permissões (usada no logout)
  const clearPermissions = () => {
    permissions.value = []
    roles.value = []
    isSuperAdmin.value = false
    
    if (process.client) {
      localStorage.removeItem('permissions')
      localStorage.removeItem('roles')
      localStorage.removeItem('isSuperAdmin')
    }
  }

  // Função para carregar permissões do localStorage
  const loadPermissionsFromStorage = () => {
    if (process.client) {
      const savedPermissions = localStorage.getItem('permissions')
      const savedRoles = localStorage.getItem('roles')
      const savedSuperAdmin = localStorage.getItem('isSuperAdmin')
      
      if (savedRoles) {
        roles.value = JSON.parse(savedRoles)
        // Extrair permissões dos roles salvos
        permissions.value = extractPermissionsFromRoles(roles.value)
      } else if (savedPermissions) {
        // Fallback para sistema antigo
        permissions.value = JSON.parse(savedPermissions)
      }
      
      if (savedSuperAdmin) {
        isSuperAdmin.value = JSON.parse(savedSuperAdmin)
      }
    }
  }

  // Inicializar permissões do localStorage
  if (process.client) {
    loadPermissionsFromStorage()
  }

  // Funções para trabalhar com roles
  const hasRole = (roleName: string): boolean => {
    return roles.value.some(role => role.name === roleName)
  }

  const getRoleNames = (): string[] => {
    return roles.value.map(role => role.name)
  }

  const getPermissionsByRole = (roleName: string): Permission[] => {
    const role = roles.value.find(role => role.name === roleName)
    return role ? role.permissions : []
  }

  return {
    // Estados
    permissions: readonly(permissions),
    roles: readonly(roles),
    isSuperAdmin: readonly(isSuperAdmin),
    
    // Funções de verificação de permissões
    hasPermission,
    canAccess,
    hasAllPermissions,
    hasAnyPermission,
    getPermissionsByResource,
    getPermissionsByAction,
    
    // Funções de roles
    hasRole,
    getRoleNames,
    getPermissionsByRole,
    
    // Funções de gerenciamento
    setRoles,
    setPermissions,
    clearPermissions,
    loadPermissionsFromStorage
  }
}
