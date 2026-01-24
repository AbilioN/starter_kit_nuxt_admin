export default defineNuxtPlugin(() => {
  // Adicionar funções de debug globalmente
  if (process.client) {
    // Função para ver dados de auth
    (window as any).debugAuth = () => {
      const { user } = useAuth()
      const { permissions, roles, isSuperAdmin } = usePermissions()
      
      console.log('🔐 AUTH DEBUG:')
      console.log('User:', user.value)
      console.log('Roles:', roles.value)
      console.log('Permissions:', permissions.value)
      console.log('Super Admin:', isSuperAdmin.value)
      
      return {
        user: user.value,
        roles: roles.value,
        permissions: permissions.value,
        isSuperAdmin: isSuperAdmin.value
      }
    }

    // Função para ver localStorage
    (window as any).debugStorage = () => {
      console.log('💾 LOCALSTORAGE DEBUG:')
      console.log('User:', JSON.parse(localStorage.getItem('user') || 'null'))
      console.log('Token:', localStorage.getItem('token'))
      console.log('Roles:', JSON.parse(localStorage.getItem('roles') || 'null'))
      console.log('Permissions:', JSON.parse(localStorage.getItem('permissions') || 'null'))
      console.log('Super Admin:', JSON.parse(localStorage.getItem('isSuperAdmin') || 'null'))
      
      return {
        user: JSON.parse(localStorage.getItem('user') || 'null'),
        token: localStorage.getItem('token'),
        roles: JSON.parse(localStorage.getItem('roles') || 'null'),
        permissions: JSON.parse(localStorage.getItem('permissions') || 'null'),
        isSuperAdmin: JSON.parse(localStorage.getItem('isSuperAdmin') || 'null')
      }
    }

    // Função para testar permissões
    (window as any).testPermission = (permission: string) => {
      const { hasPermission } = usePermissions()
      const result = hasPermission(permission)
      console.log(`🧪 Permission test: ${permission} = ${result ? '✅' : '❌'}`)
      return result
    }

    // Função para limpar tudo (logout)
    (window as any).clearAuth = () => {
      localStorage.clear()
      location.reload()
      console.log('🧹 Auth data cleared!')
    }

    // Função para testar roles
    (window as any).testRole = (roleName: string) => {
      const { hasRole } = usePermissions()
      const result = hasRole(roleName)
      console.log(`🎭 Role test: ${roleName} = ${result ? '✅' : '❌'}`)
      return result
    }

    // Função para listar todos os roles
    (window as any).listRoles = () => {
      const { getRoleNames } = usePermissions()
      const roles = getRoleNames()
      console.log('🎭 Available roles:', roles)
      return roles
    }

    console.log('🐛 Debug functions available:')
    console.log('- debugAuth() - Show auth data')
    console.log('- debugStorage() - Show localStorage data')
    console.log('- testPermission("permission-name") - Test specific permission')
    console.log('- testRole("role-name") - Test specific role')
    console.log('- listRoles() - List all user roles')
    console.log('- clearAuth() - Clear all auth data')
  }
})
