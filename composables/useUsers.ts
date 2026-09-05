import type { User, UsersResponse, Pagination } from '~/types/api';
import { AuthService } from '~/services/AuthService';
import { UserService } from '~/services/UserService';
import { ApiError } from '~/infrastructure/http/ApiClient';
import type { CustomFieldDescriptor, CustomFieldValue } from '~/types/custom-fields';

export const useUsers = () => {
  // Estados reativos
  const users = ref<User[]>([]);
  const pagination = ref<Pagination | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Instância do serviço
  const authService = new AuthService();
  const userService = new UserService();
  const notification = useNotification();

  const saving = ref(false);

  /**
   * The tenant's own fields for this entity, described once.
   *
   * It arrives WITH the list rather than from a separate call: a screen that
   * draws user rows or a user form needs to know which fields exist before it
   * knows any values, and a second round trip for that is a second chance for
   * the two to disagree.
   */
  const customFields = ref<CustomFieldDescriptor[]>([]);

  /** One user's values, loaded when a form opens. */
  const customValues = ref<CustomFieldValue[]>([]);

  // Função para carregar usuários
  const loadUsers = async (page: number = 1, perPage: number = 15) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await authService.getUsers(page, perPage);
      
      if (result.success && result.data) {
        users.value = result.data.users;
        pagination.value = result.data.pagination;
        customFields.value = (result.data as any).custom_fields ?? [];
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
      // Removido o avatar de stock atribuído por hash do id. `User` não tem
      // funcionalidade de foto (só Admin tem), portanto ficam as iniciais.
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

  /**
   * One user, with its custom values.
   *
   * Called when an edit form opens — never on render, and never as a side
   * effect of this composable being invoked.
   */
  const fetchUser = async (id: string) => {
    try {
      const detail = await userService.get(id);
      customFields.value = detail.custom_fields ?? [];
      customValues.value = detail.custom ?? [];

      return detail.user;
    } catch (e: any) {
      error.value = e?.message ?? 'Could not load the user.';
      notification.error(error.value as string);

      return null;
    }
  };

  /**
   * @returns the columns the server dropped because this admin may not write
   *          them, or null when the save failed. An empty array means a clean
   *          save; a non-empty one is worth telling the person about.
   */
  const updateUser = async (id: string, payload: Record<string, unknown>): Promise<string[] | null> => {
    saving.value = true;
    error.value = null;

    try {
      const result = await userService.update(id, payload);
      customValues.value = result.custom ?? [];
      customFields.value = result.custom_fields ?? customFields.value;

      return result.ignored_fields ?? [];
    } catch (e: any) {
      error.value = e?.message ?? 'Could not save the user.';

      // A 422 belongs on the fields the server named, so it is rethrown for
      // the form to place rather than flattened into a snackbar.
      if (e instanceof ApiError && Object.keys(e.errors).length > 0) throw e;

      notification.error(error.value as string);

      return null;
    } finally {
      saving.value = false;
    }
  };

  return {
    // Estados
    users: readonly(users),
    saving: readonly(saving),
    customFields: readonly(customFields),
    customValues: readonly(customValues),
    fetchUser,
    updateUser,
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