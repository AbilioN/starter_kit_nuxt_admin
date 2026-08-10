<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import UserAvatar from '@/components/shared/UserAvatar.vue';

// Definir middleware de autenticação e permissões
definePageMeta({
  middleware: ['auth', 'permissions']
});

const { t } = useI18n();

// Usar o composable de administradores
const {
  formattedAdmins,
  pagination,
  loading,
  error,
  loadAdmins,
  nextPage,
  prevPage,
  goToPage,
  changePerPage,
  canGoNext,
  canGoPrev,
  pageNumbers,
  createAdmin,
  updateAdmin,
  deleteAdmin
} = useAdmins();

// Usar composable de roles para seleção
const { formattedRoles, loadRoles } = useRoles();

// Verificar permissões
const { hasPermission, canAccess } = usePermissions();

// Notificações
const notification = useNotification();

// Estados reativos para filtros
const search = ref('');
const selectedStatus = ref('all');
const selectedRole = ref('all');
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedAdmin = ref<any>(null);

// Estados do chat
const showChatDialog = ref(false);
const selectedChatAdmin = ref<any>(null);

// Estados do formulário de admin
const adminForm = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  is_active: true,
  role_id: null as number | null
});

// Estado para salvar
const saving = ref(false);
const saveError = ref<string | null>(null);

// Filtros disponíveis
const statusOptions = computed(() => [
  { value: 'all', label: t('common.labels.allStatuses') },
  { value: 'Ativo', label: t('common.labels.active') },
  { value: 'Inativo', label: t('common.labels.inactive') }
]);

const roleOptions = computed(() => [
  { value: 'all', label: t('pages.users.allRoles') },
  { value: 'Super Admin', label: 'Super Admin' },
  { value: 'Admin', label: 'Admin' }
]);

// Computed para filtrar administradores
const filteredAdmins = computed(() => {
  return formattedAdmins.value.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(search.value.toLowerCase()) ||
                         admin.email.toLowerCase().includes(search.value.toLowerCase());
    const matchesStatus = selectedStatus.value === 'all' || admin.status === selectedStatus.value;
    const matchesRole = selectedRole.value === 'all' || admin.role === selectedRole.value;
    
    return matchesSearch && matchesStatus && matchesRole;
  });
});

// Funções de ação
const addAdmin = async () => {
  if (hasPermission('admin-create')) {
    // Resetar formulário
    adminForm.value = {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      is_active: true,
      role_id: null
    };
    
    // Carregar roles se ainda não carregou
    if (formattedRoles.value.length === 0) {
      await loadRoles();
    }
    
    showAddDialog.value = true;
  }
};

const editAdmin = async (admin: any) => {
  if (hasPermission('admin-update')) {
    selectedAdmin.value = { ...admin };
    
    // Preencher formulário com dados do admin
    adminForm.value = {
      name: admin.name,
      email: admin.email,
      password: '',
      password_confirmation: '',
      is_active: admin.is_active,
      role_id: null // Você pode adicionar lógica para pegar o role_id se necessário
    };
    
    // Carregar roles se ainda não carregou
    if (formattedRoles.value.length === 0) {
      await loadRoles();
    }
    
    showEditDialog.value = true;
  }
};

const selectAdminToDelete = (admin: any) => {
  if (hasPermission('admin-delete')) {
    selectedAdmin.value = admin;
    showDeleteDialog.value = true;
  }
};

const saveAdmin = async () => {
  saving.value = true;
  saveError.value = null;
  
  try {
    if (selectedAdmin.value) {
      // Editando admin existente
      const updateData = {
        id: selectedAdmin.value.id,
        name: adminForm.value.name,
        email: adminForm.value.email,
        is_active: adminForm.value.is_active
      };
      
      const result = await updateAdmin(updateData);
      
      if (result.success) {
        showEditDialog.value = false;
        notification.success('Administrator updated successfully');
        await loadAdmins(pagination.value?.current_page || 1, pagination.value?.per_page || 15);
      } else {
        saveError.value = result.error || 'Failed to update admin';
        notification.error(result.error || 'Failed to update admin');
      }
    } else {
      // Criando novo admin
      const result = await createAdmin(adminForm.value);
      
      if (result.success) {
        showAddDialog.value = false;
        notification.success('Administrator created successfully');
        await loadAdmins(pagination.value?.current_page || 1, pagination.value?.per_page || 15);
      } else {
        saveError.value = result.error || 'Failed to create admin';
        notification.error(result.error || 'Failed to create admin');
      }
    }
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Unexpected error';
    notification.error(error instanceof Error ? error.message : 'Unexpected error');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async () => {
  if (selectedAdmin.value) {
    saving.value = true;
    saveError.value = null;
    
    try {
      const result = await deleteAdmin(selectedAdmin.value.id);
      
      if (result.success) {
        showDeleteDialog.value = false;
        selectedAdmin.value = null;
        notification.success('Administrator deleted successfully');
        await loadAdmins(pagination.value?.current_page || 1, pagination.value?.per_page || 15);
      } else {
        saveError.value = result.error || 'Failed to delete admin';
        notification.error(result.error || 'Failed to delete admin');
      }
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : 'Unexpected error';
      notification.error(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      saving.value = false;
    }
  }
};

const toggleAdminStatus = (admin: any) => {
  if (hasPermission('admin-update')) {
    // Aqui você implementaria a chamada para alterar status na API
    if (admin.status === 'Ativo') {
      admin.status = 'Inativo';
      admin.statusColor = 'error';
    } else {
      admin.status = 'Ativo';
      admin.statusColor = 'success';
    }
  }
};

// Função para iniciar chat com administrador
const startChat = async (admin: any) => {
  if (canAccess('chat', 'read')) {
    console.log('Iniciando chat com administrador:', admin);
    selectedChatAdmin.value = admin;
    showChatDialog.value = true;
  }
};

const clearFilters = () => {
  search.value = '';
  selectedStatus.value = 'all';
  selectedRole.value = 'all';
};

// Carregar administradores quando a página for montada
onMounted(() => {
  loadAdmins();
});
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">{{ t('pages.admins.title') }}</h1>
            <p class="text-body-1 text-medium-emphasis">
              {{ t('pages.admins.subtitle') }}
            </p>
          </div>
          <v-btn
            v-if="hasPermission('admin-create')"
            color="primary"
            prepend-icon="mdi-plus"
            @click="addAdmin"
            size="large"
          >
            {{ t('pages.admins.addAdmin') }}
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-row class="mb-6">
      <v-col cols="12">
        <UiChildCard :title="t('pages.admins.filters')">
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="search"
                :label="t('pages.admins.searchPlaceholder')"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="selectedStatus"
                :items="statusOptions"
                item-title="label"
                item-value="value"
                :label="t('common.labels.status')"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="selectedRole"
                :items="roleOptions"
                item-title="label"
                item-value="value"
                :label="t('common.labels.role')"
                variant="outlined"
                density="compact"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <div class="d-flex gap-2">
                <v-btn
                  variant="outlined"
                  @click="clearFilters"
                  prepend-icon="mdi-refresh"
                >
                  {{ t('common.actions.clearFilters') }}
                </v-btn>
                <v-chip
                  color="primary"
                  variant="tonal"
                  class="ml-auto"
                >
                  {{ t('pages.admins.adminsFound', { count: filteredAdmins.length }) }}
                </v-chip>
              </div>
            </v-col>
          </v-row>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Loading -->
    <v-row v-if="loading">
      <v-col cols="12">
        <UiChildCard>
          <div class="d-flex justify-center align-center py-8">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          </div>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Erro -->
    <v-row v-else-if="error">
      <v-col cols="12">
        <UiChildCard>
          <v-alert type="error" variant="tonal" class="mb-0">
            {{ error }}
          </v-alert>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Tabela de Administradores -->
    <v-row v-else>
      <v-col cols="12">
        <UiChildCard :title="t('pages.admins.listTitle')">
          <v-table fixed-header height="600px">
            <thead>
              <tr>
                <th class="text-left">{{ t('pages.admins.tableAdministrator') }}</th>
                <th class="text-left">{{ t('common.labels.email') }}</th>
                <th class="text-left">{{ t('common.labels.role') }}</th>
                <th class="text-left">{{ t('common.labels.status') }}</th>
                <th class="text-left">{{ t('common.labels.lastLogin') }}</th>
                <th class="text-center">{{ t('common.labels.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="admin in filteredAdmins" :key="admin.id">
                <td>
                  <div class="d-flex align-center">
                    <UserAvatar :src="admin.avatar_url" :name="admin.name" :size="40" class="mr-3" />
                    <div>
                      <div class="font-weight-medium">{{ admin.name }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ admin.email }}</td>
                <td>
                  <v-chip
                    :color="admin.role === 'Super Admin' ? 'error' : 'primary'"
                    variant="tonal"
                    size="small"
                  >
                    {{ admin.role }}
                  </v-chip>
                </td>
                <td>
                  <v-chip
                    :color="admin.statusColor"
                    variant="tonal"
                    size="small"
                  >
                    {{ admin.status }}
                  </v-chip>
                </td>
                <td>{{ admin.lastLogin }}</td>
                <td>
                  <div class="d-flex justify-center gap-1">
                    <v-btn
                      v-if="canAccess('chat', 'read')"
                      icon
                      size="small"
                      variant="text"
                      color="info"
                      @click="startChat(admin)"
                      :title="t('pages.users.startChat')"
                    >
                      <v-icon>mdi-chat</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="hasPermission('admin-update')"
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click="editAdmin(admin)"
                      :title="t('common.actions.edit')"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="hasPermission('admin-update')"
                      icon
                      size="small"
                      variant="text"
                      :color="admin.status === 'Ativo' ? 'warning' : 'success'"
                      @click="toggleAdminStatus(admin)"
                      :title="admin.status === 'Ativo' ? t('common.actions.deactivate') : t('common.actions.activate')"
                    >
                      <v-icon>{{ admin.status === 'Ativo' ? 'mdi-account-off' : 'mdi-account-check' }}</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="hasPermission('admin-delete')"
                      icon
                      size="small"
                      variant="text"
                      color="error"
                      @click="selectAdminToDelete(admin)"
                      :title="t('common.actions.delete')"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>

          <!-- Info sobre total (quando não há paginação) -->
          <div v-if="pagination && pagination.last_page === 1" class="d-flex justify-end mt-4">
            <div class="text-body-2 text-medium-emphasis">
              {{ t('pages.admins.totalAdmins', { count: pagination.total }) }}
            </div>
          </div>

          <!-- Paginação (quando há múltiplas páginas) -->
          <div v-if="pagination && pagination.last_page > 1" class="d-flex align-center justify-space-between mt-4">
            <div class="text-body-2 text-medium-emphasis">
              {{ t('pages.admins.showingRange', { from: pagination.from, to: pagination.to, total: pagination.total }) }}
            </div>
            
            <div class="d-flex align-center gap-2">
              <!-- Itens por página -->
              <v-select
                :model-value="pagination.per_page"
                @update:model-value="changePerPage"
                :items="[10, 15, 25, 50]"
                variant="outlined"
                density="compact"
                hide-details
                style="width: 80px"
              />
              
              <!-- Navegação -->
              <v-btn
                icon
                variant="text"
                :disabled="!canGoPrev"
                @click="prevPage"
                :title="t('pages.users.previousPage')"
              >
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>
              
              <!-- Números das páginas -->
              <div class="d-flex gap-1">
                <v-btn
                  v-for="page in pageNumbers"
                  :key="page"
                  :color="page === pagination.current_page ? 'primary' : undefined"
                  variant="text"
                  size="small"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </v-btn>
              </div>
              
              <v-btn
                icon
                variant="text"
                :disabled="!canGoNext"
                @click="nextPage"
                :title="t('pages.users.nextPage')"
              >
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </div>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Diálogos -->
    <v-dialog v-model="showAddDialog" max-width="600px" scrollable>
      <v-card>
        <v-card-title>{{ t('pages.admins.createDialogTitle') }}</v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="adminForm.name"
                  :label="t('common.labels.name')"
                  variant="outlined"
                  required
                  :placeholder="t('pages.admins.namePlaceholder')"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="adminForm.email"
                  :label="t('common.labels.email')"
                  variant="outlined"
                  required
                  type="email"
                  :placeholder="t('pages.admins.emailPlaceholder')"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="adminForm.password"
                  :label="t('common.labels.password')"
                  variant="outlined"
                  required
                  type="password"
                  :placeholder="t('pages.admins.passwordPlaceholder')"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="adminForm.password_confirmation"
                  :label="t('pages.admins.confirmPasswordLabel')"
                  variant="outlined"
                  required
                  type="password"
                  :placeholder="t('pages.admins.confirmPasswordPlaceholder')"
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="adminForm.role_id"
                  :items="formattedRoles"
                  item-title="name"
                  item-value="id"
                  :label="t('pages.admins.roleLabel')"
                  variant="outlined"
                  clearable
                  :placeholder="t('pages.admins.rolePlaceholder')"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:subtitle>
                        <span class="text-caption">{{ t('pages.admins.permissionsCount', { count: item.raw.permissionsCount }) }}</span>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="adminForm.is_active"
                  :label="t('pages.admins.activeSwitch')"
                  color="primary"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-alert v-if="saveError" type="error" variant="tonal" density="compact" class="mr-4">
            {{ saveError }}
          </v-alert>
          <v-btn @click="showAddDialog = false" :disabled="saving">{{ t('common.actions.cancel') }}</v-btn>
          <v-btn color="primary" @click="saveAdmin" :loading="saving" :disabled="saving">{{ t('common.actions.create') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showEditDialog" max-width="600px" scrollable>
      <v-card>
        <v-card-title>{{ t('pages.admins.editDialogTitleName', { name: selectedAdmin?.name }) }}</v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="adminForm.name"
                  :label="t('common.labels.name')"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="adminForm.email"
                  :label="t('common.labels.email')"
                  variant="outlined"
                  required
                  type="email"
                />
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="adminForm.is_active"
                  :label="t('pages.admins.activeSwitch')"
                  color="primary"
                  hide-details
                />
              </v-col>

              <v-col cols="12">
                <v-alert type="info" variant="tonal" density="compact">
                  <div class="text-caption">{{ t('pages.admins.keepPasswordHint') }}</div>
                </v-alert>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-alert v-if="saveError" type="error" variant="tonal" density="compact" class="mr-4">
            {{ saveError }}
          </v-alert>
          <v-btn @click="showEditDialog = false" :disabled="saving">{{ t('common.actions.cancel') }}</v-btn>
          <v-btn color="primary" @click="saveAdmin" :loading="saving" :disabled="saving">{{ t('common.actions.saveChanges') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title>{{ t('pages.users.deleteDialogTitle') }}</v-card-title>
        <v-card-text>
          <p>{{ t('pages.admins.deleteConfirmBody') }}</p>
          <p><strong>{{ selectedAdmin?.name }}</strong></p>
          <v-alert v-if="saveError" type="error" variant="tonal" density="compact" class="mt-4">
            {{ saveError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDeleteDialog = false" :disabled="saving">{{ t('common.actions.cancel') }}</v-btn>
          <v-btn color="error" @click="confirmDelete" :loading="saving" :disabled="saving">{{ t('common.actions.delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Chat Dialog -->
    <v-dialog v-model="showChatDialog" max-width="800px">
      <v-card>
        <v-card-title>{{ t('pages.admins.chatDialogTitle', { name: selectedChatAdmin?.name }) }}</v-card-title>
        <v-card-text>
          <p>{{ t('pages.admins.chatDialogBody') }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showChatDialog = false">{{ t('common.actions.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
