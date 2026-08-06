<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import PermissionSelector from '@/components/PermissionSelector.vue';
import { AuthService } from '~/services/AuthService';

// Definir middleware de autenticação e permissões
definePageMeta({
  middleware: ['auth', 'permissions']
});

const { t } = useI18n();

// Usar o composable de roles
const {
  formattedRoles,
  loading,
  error,
  loadRoles
} = useRoles();

// Usar o composable de permissions disponíveis
const {
  permissions: availablePermissions,
  loading: loadingPermissions,
  groupedPermissions,
  loadPermissions,
  formatResourceName
} = useAvailablePermissions();

// Verificar permissões
const { hasPermission, canAccess } = usePermissions();

// Notificações
const notification = useNotification();

// Estados reativos para filtros
const search = ref('');
const selectedStatus = ref('all');
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const showPermissionsDialog = ref(false);
const selectedRole = ref<any>(null);

// Estados do formulário de role
const roleForm = ref({
  name: '',
  description: '',
  is_active: true,
  selectedPermissions: [] as number[]
});

// Filtros disponíveis
const statusOptions = computed(() => [
  { value: 'all', label: t('common.labels.allStatuses') },
  { value: 'Ativo', label: t('common.labels.active') },
  { value: 'Inativo', label: t('common.labels.inactive') }
]);

// Computed para filtrar roles
const filteredRoles = computed(() => {
  return formattedRoles.value.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(search.value.toLowerCase()) ||
                         role.description.toLowerCase().includes(search.value.toLowerCase());
    const matchesStatus = selectedStatus.value === 'all' || role.status === selectedStatus.value;
    
    return matchesSearch && matchesStatus;
  });
});

// Funções de ação
const addRole = async () => {
  if (hasPermission('role-create')) {
    // Resetar formulário
    roleForm.value = {
      name: '',
      description: '',
      is_active: true,
      selectedPermissions: []
    };
    
    // Carregar permissões disponíveis se ainda não carregou
    if (availablePermissions.value.length === 0) {
      await loadPermissions();
    }
    
    showAddDialog.value = true;
  }
};

const editRole = async (role: any) => {
  if (hasPermission('role-update')) {
    selectedRole.value = { ...role };
    
    // Preencher formulário com dados do role
    roleForm.value = {
      name: role.name,
      description: role.description,
      is_active: role.is_active,
      selectedPermissions: role.permissions ? role.permissions.map((p: any) => p.id) : []
    };
    
    // Carregar permissões disponíveis se ainda não carregou
    if (availablePermissions.value.length === 0) {
      await loadPermissions();
    }
    
    showEditDialog.value = true;
  }
};

const deleteRole = (role: any) => {
  if (hasPermission('role-delete')) {
    selectedRole.value = role;
    showDeleteDialog.value = true;
  }
};

const viewPermissions = (role: any) => {
  selectedRole.value = role;
  showPermissionsDialog.value = true;
};

const confirmDelete = async () => {
  if (selectedRole.value) {
    saving.value = true;
    saveError.value = null;
    
    try {
      const result = await authService.deleteRole({ id: selectedRole.value.id });
      
      if (result.success) {
        showDeleteDialog.value = false;
        selectedRole.value = null;
        notification.success('Role deleted successfully');
        // Recarregar roles após deletar
        await loadRoles();
      } else {
        saveError.value = result.error || 'Failed to delete role';
        notification.error(result.error || 'Failed to delete role');
      }
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : 'Unexpected error';
      notification.error(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      saving.value = false;
    }
  }
};

const toggleRoleStatus = (role: any) => {
  if (hasPermission('role-update')) {
    // Aqui você implementaria a chamada para alterar status na API
    if (role.status === 'Ativo') {
      role.status = 'Inativo';
      role.statusColor = 'error';
    } else {
      role.status = 'Ativo';
      role.statusColor = 'success';
    }
  }
};

const clearFilters = () => {
  search.value = '';
  selectedStatus.value = 'all';
};

// Service instance
const authService = new AuthService();

// Estado para salvar
const saving = ref(false);
const saveError = ref<string | null>(null);

// Função para salvar role (criar ou editar)
const saveRole = async () => {
  saving.value = true;
  saveError.value = null;
  
  try {
    if (selectedRole.value) {
      // Editando role existente
      const updateData = {
        id: selectedRole.value.id,
        name: roleForm.value.name,
        description: roleForm.value.description
      };
      
      const result = await authService.updateRole(updateData);
      
      if (result.success) {
        // Atualizar permissões separadamente
        if (roleForm.value.selectedPermissions.length > 0 || selectedRole.value.permissions?.length > 0) {
          const permResult = await authService.updateRolePermissions({
            id: selectedRole.value.id,
            permissions: roleForm.value.selectedPermissions
          });
          
          if (!permResult.success) {
            saveError.value = permResult.error || 'Failed to update permissions';
            notification.error(permResult.error || 'Failed to update permissions');
            return;
          }
        }
        
        // Fechar diálogo e mostrar notificação de sucesso
        showEditDialog.value = false;
        notification.success('Role updated successfully');
      } else {
        saveError.value = result.error || 'Failed to update role';
        notification.error(result.error || 'Failed to update role');
        return;
      }
    } else {
      // Criando novo role
      const createData = {
        name: roleForm.value.name,
        description: roleForm.value.description,
        permissions: roleForm.value.selectedPermissions
      };
      
      const result = await authService.createRole(createData);
      
      if (result.success) {
        // Fechar diálogo e mostrar notificação de sucesso
        showAddDialog.value = false;
        notification.success('Role created successfully');
      } else {
        saveError.value = result.error || 'Failed to create role';
        notification.error(result.error || 'Failed to create role');
        return;
      }
    }
    
    // Recarregar roles
    await loadRoles();
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Unexpected error';
    notification.error(error instanceof Error ? error.message : 'Unexpected error');
  } finally {
    saving.value = false;
  }
};

// Carregar roles quando a página for montada
onMounted(() => {
  loadRoles();
});
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">{{ t('pages.roles.title') }}</h1>
            <p class="text-body-1 text-medium-emphasis">
              {{ t('pages.roles.subtitle') }}
            </p>
          </div>
          <v-btn
            v-if="hasPermission('role-create')"
            color="primary"
            prepend-icon="mdi-plus"
            @click="addRole"
            size="large"
          >
            {{ t('pages.roles.createRole') }}
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-row class="mb-6">
      <v-col cols="12">
        <UiChildCard :title="t('pages.roles.filters')">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="search"
                :label="t('pages.roles.searchPlaceholder')"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" md="6">
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
                  {{ t('pages.roles.rolesFound', { count: filteredRoles.length }) }}
                </v-chip>
              </div>
            </v-col>
          </v-row>
        </UiChildCard>
      </v-col> </v-row>

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

    <!-- Tabela de Roles -->
    <v-row v-else>
      <v-col cols="12">
        <UiChildCard :title="t('pages.roles.listTitle')">
          <v-table fixed-header height="600px">
            <thead>
              <tr>
                <th class="text-left">{{ t('common.labels.name') }}</th>
                <th class="text-left">{{ t('common.labels.description') }}</th>
                <th class="text-left">{{ t('pages.roles.tablePermissions') }}</th>
                <th class="text-left">{{ t('common.labels.status') }}</th>
                <th class="text-left">{{ t('common.labels.createdAt') }}</th>
                <th class="text-center">{{ t('common.labels.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="role in filteredRoles" :key="role.id">
                <td>
                  <div class="font-weight-medium">{{ role.name }}</div>
                </td>
                <td>{{ role.description }}</td>
                <td>
                  <v-chip
                    color="info"
                    variant="tonal"
                    size="small"
                  >
                    {{ t('pages.roles.permissionsCount', { count: role.permissionsCount }) }}
                  </v-chip>
                </td>
                <td>
                  <v-chip
                    :color="role.statusColor"
                    variant="tonal"
                    size="small"
                  >
                    {{ role.status }}
                  </v-chip>
                </td>
                <td>{{ role.createdDate }}</td>
                <td>
                  <div class="d-flex justify-center gap-1">
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="info"
                      @click="viewPermissions(role)"
                      :title="t('pages.roles.viewPermissions')"
                    >
                      <v-icon>mdi-eye</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="hasPermission('role-update')"
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click="editRole(role)"
                      :title="t('common.actions.edit')"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="hasPermission('role-update')"
                      icon
                      size="small"
                      variant="text"
                      :color="role.status === 'Ativo' ? 'warning' : 'success'"
                      @click="toggleRoleStatus(role)"
                      :title="role.status === 'Ativo' ? t('common.actions.deactivate') : t('common.actions.activate')"
                    >
                      <v-icon>{{ role.status === 'Ativo' ? 'mdi-toggle-switch-off' : 'mdi-toggle-switch' }}</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="hasPermission('role-delete')"
                      icon
                      size="small"
                      variant="text"
                      color="error"
                      @click="deleteRole(role)"
                      :title="t('common.actions.delete')"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>

          <!-- Info sobre total de roles -->
          <div class="d-flex justify-end mt-4">
            <div class="text-body-2 text-medium-emphasis">
              {{ t('pages.roles.totalRoles', { count: formattedRoles.length }) }}
            </div>
          </div>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Diálogos -->
    <v-dialog v-model="showAddDialog" max-width="900px" scrollable>
      <v-card>
        <v-card-title>{{ t('pages.roles.createDialogTitle') }}</v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="roleForm.name"
                  :label="t('pages.roles.roleNameLabel')"
                  variant="outlined"
                  required
                  :placeholder="t('pages.roles.roleNamePlaceholder')"
                  :hint="t('pages.roles.roleNameHint')"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="roleForm.description"
                  :label="t('common.labels.description')"
                  variant="outlined"
                  rows="3"
                  :placeholder="t('pages.roles.descriptionPlaceholder')"
                />
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="roleForm.is_active"
                  :label="t('pages.roles.activeRoleSwitch')"
                  color="primary"
                  hide-details
                />
              </v-col>

              <v-col cols="12">
                <PermissionSelector
                  v-model="roleForm.selectedPermissions"
                  :grouped-permissions="groupedPermissions"
                  :loading="loadingPermissions"
                  :format-resource-name="formatResourceName"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-chip color="info" variant="tonal">
            {{ t('pages.roles.permissionsSelected', { count: roleForm.selectedPermissions.length }) }}
          </v-chip>
          <v-spacer></v-spacer>
          <v-alert v-if="saveError" type="error" variant="tonal" density="compact" class="mr-4">
            {{ saveError }}
          </v-alert>
          <v-btn @click="showAddDialog = false" :disabled="saving">{{ t('common.actions.cancel') }}</v-btn>
          <v-btn color="primary" @click="saveRole" :loading="saving" :disabled="saving">{{ t('pages.roles.createRole') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showEditDialog" max-width="900px" scrollable>
      <v-card>
        <v-card-title>{{ t('pages.roles.editDialogTitle', { name: selectedRole?.name }) }}</v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="roleForm.name"
                  :label="t('pages.roles.roleNameLabel')"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="roleForm.description"
                  :label="t('common.labels.description')"
                  variant="outlined"
                  rows="3"
                />
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="roleForm.is_active"
                  :label="t('pages.roles.activeRoleSwitch')"
                  color="primary"
                  hide-details
                />
              </v-col>

              <v-col cols="12">
                <PermissionSelector
                  v-model="roleForm.selectedPermissions"
                  :grouped-permissions="groupedPermissions"
                  :loading="loadingPermissions"
                  :format-resource-name="formatResourceName"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-chip color="info" variant="tonal">
            {{ t('pages.roles.permissionsSelected', { count: roleForm.selectedPermissions.length }) }}
          </v-chip>
          <v-spacer></v-spacer>
          <v-alert v-if="saveError" type="error" variant="tonal" density="compact" class="mr-4">
            {{ saveError }}
          </v-alert>
          <v-btn @click="showEditDialog = false" :disabled="saving">{{ t('common.actions.cancel') }}</v-btn>
          <v-btn color="primary" @click="saveRole" :loading="saving" :disabled="saving">{{ t('common.actions.saveChanges') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title>{{ t('pages.users.deleteDialogTitle') }}</v-card-title>
        <v-card-text>
          <p>{{ t('pages.roles.deleteConfirmBody') }}</p>
          <p><strong>{{ selectedRole?.name }}</strong></p>
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

    <!-- Diálogo de Permissões -->
    <v-dialog v-model="showPermissionsDialog" max-width="800px">
      <v-card>
        <v-card-title>{{ t('pages.roles.permissionsDialogTitle', { name: selectedRole?.name }) }}</v-card-title>
        <v-card-text>
          <div v-if="selectedRole">
            <p><strong>{{ t('pages.roles.permissionsDialogDescription') }}</strong> {{ selectedRole.description }}</p>
            <p><strong>{{ t('pages.roles.permissionsDialogTotal') }}</strong> {{ selectedRole.permissionsCount }}</p>

            <div v-if="selectedRole.permissions && selectedRole.permissions.length > 0" class="mt-4">
              <h4>{{ t('pages.roles.permissionsListTitle') }}</h4>
              <div class="permissions-grid">
                <v-chip
                  v-for="permission in selectedRole.permissions"
                  :key="permission.id"
                  :color="permission.is_active ? 'primary' : 'grey'"
                  class="mr-2 mb-2"
                >
                  {{ permission.name }} ({{ permission.slug }})
                </v-chip>
              </div>
            </div>
            <div v-else>
              <p>{{ t('pages.roles.noPermissionsFound') }}</p>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showPermissionsDialog = false">{{ t('common.actions.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.permissions-grid {
  max-height: 300px;
  overflow-y: auto;
}
</style>
