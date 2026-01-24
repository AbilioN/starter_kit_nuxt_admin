export default defineNuxtRouteMiddleware(async (to, from) => {
  const { checkAuth } = useAuth()
  
  // Verificar se o usuário está autenticado
  const isAuthenticated = await checkAuth()
  
  // Se não estiver autenticado e não estiver na página de login, redirecionar
  if (!isAuthenticated && to.path !== '/auth/login' && to.path !== '/auth/register') {
    return navigateTo('/auth/login')
  }
  
  // Se estiver autenticado e tentar acessar páginas de auth, redirecionar para dashboard
  if (isAuthenticated && (to.path === '/auth/login' || to.path === '/auth/register')) {
    return navigateTo('/dashboard')
  }
}) 