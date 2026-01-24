import type { Admin, LoginResponse } from '~/types/api';
import { AuthService } from '~/services/AuthService';

export const useAuth = () => {
  // Estado reativo do usuário
  const user = useState<Admin | null>('user', () => null)
  const isAuthenticated = computed(() => !!user.value)
  
  // Instância do serviço de autenticação
  const authService = new AuthService();
  
  // Composable de permissões
  const { setRoles, setPermissions, clearPermissions, loadPermissionsFromStorage } = usePermissions();
  
  // Notificações
  const notification = useNotification();

  // Função de login
  const login = async (email: string, password: string) => {
    try {
      const result = await authService.login(email, password);
      
      if (result.success && result.data) {
        const loginData = result.data as LoginResponse;
        
        // Definir dados do usuário
        user.value = loginData.admin;
        
        // Definir roles, permissões e status de super admin
        if (loginData.roles) {
          // Nova estrutura com roles
          setRoles(loginData.roles, loginData.admin.is_super_admin);
        } else {
          // Fallback para estrutura antiga (se ainda existir)
          setPermissions([], loginData.admin.is_super_admin);
        }
        
        // Salvar dados do usuário no localStorage
        if (process.client) {
          localStorage.setItem('user', JSON.stringify(loginData.admin));
          localStorage.setItem('token', loginData.token);
        }
        
        return { success: true };
      } else {
        // Retornar a mensagem de erro específica da API
        return { 
          success: false, 
          error: result.error || 'Invalid credentials' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }

  // Função de logout
  const logout = async () => {
    try {
      await authService.logout();
      notification.info('Logged out successfully');
    } finally {
      user.value = null;
      
      // Limpar permissões
      clearPermissions();
      
      if (process.client) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
      navigateTo('/auth/login');
    }
  }

  // Função para verificar se o usuário está logado (usado no middleware)
  const checkAuth = async () => {
    if (process.client && !user.value) {
      // Carregar permissões do localStorage
      loadPermissionsFromStorage();
      
      // Tentar recuperar usuário do localStorage
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        user.value = JSON.parse(savedUser);
      }
      
      // Se não há usuário salvo mas há token, tentar buscar dados do usuário
      if (!user.value && authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          user.value = currentUser;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
      }
    }
    return isAuthenticated.value;
  }

  // Inicializar o estado quando o composable for usado
  if (process.client) {
    checkAuth();
  }

  return {
    user: readonly(user),
    isAuthenticated,
    login,
    logout,
    checkAuth
  }
} 