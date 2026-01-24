<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import PermissionSelector from '@/components/PermissionSelector.vue';
import { AuthService } from '~/services/AuthService';

// Definir middleware de autenticação e permissões
definePageMeta({
  middleware: ['auth', 'permissions']
});

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
const statusOptions = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'Ativo', label: 'Ativo' },
  { value: 'Inativo', label: 'Inativo' }
];

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
            <h1 class="text-h4 font-weight-bold">Roles</h1>
            <p class="text-body-1 text-medium-emphasis">
              Gerencie roles e permissões do sistema
            </p>
          </div>
          <v-btn
            v-if="hasPermission('role-create')"
            color="primary"
            prepend-icon="mdi-plus"
            @click="addRole"
            size="large"
          >
            Criar Role
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-row class="mb-6">
      <v-col cols="12">
        <UiChildCard title="Filters">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="search"
                label="Search by name or description"
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
                label="Status"
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
                  Clear Filters
                </v-btn>
                <v-chip
                  color="primary"
                  variant="tonal"
                  class="ml-auto"
                >
                  {{ filteredRoles.length }} roles found
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
        <UiChildCard title="Roles List">
          <v-table fixed-header height="600px">
            <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-left">Description</th>
                <th class="text-left">Permissions</th>
                <th class="text-left">Status</th>
                <th class="text-left">Created At</th>
                <th class="text-center">Actions</th>
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
                    {{ role.permissionsCount }} permissions
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
                      title="View Permissions"
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
                      title="Edit"
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
                      :title="role.status === 'Ativo' ? 'Deactivate' : 'Activate'"
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
                      title="Delete"
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
              Total: {{ formattedRoles.length }} roles
            </div>
          </div>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Diálogos -->
    <v-dialog v-model="showAddDialog" max-width="900px" scrollable>
      <v-card>
        <v-card-title>Create Role</v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="roleForm.name"
                  label="Role Name"
                  variant="outlined"
                  required
                  placeholder="Ex: Manager"
                  hint="Slug will be auto-generated from name"
                />
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="roleForm.description"
                  label="Description"
                  variant="outlined"
                  rows="3"
                  placeholder="Describe the purpose of this role..."
                />
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="roleForm.is_active"
                  label="Active Role"
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
            {{ roleForm.selectedPermissions.length }} permissions selected
          </v-chip>
          <v-spacer></v-spacer>
          <v-alert v-if="saveError" type="error" variant="tonal" density="compact" class="mr-4">
            {{ saveError }}
          </v-alert>
          <v-btn @click="showAddDialog = false" :disabled="saving">Cancel</v-btn>
          <v-btn color="primary" @click="saveRole" :loading="saving" :disabled="saving">Create Role</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showEditDialog" max-width="900px" scrollable>
      <v-card>
        <v-card-title>Edit Role: {{ selectedRole?.name }}</v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="roleForm.name"
                  label="Role Name"
                  variant="outlined"
                  required
                />
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="roleForm.description"
                  label="Description"
                  variant="outlined"
                  rows="3"
                />
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="roleForm.is_active"
                  label="Active Role"
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
            {{ roleForm.selectedPermissions.length }} permissions selected
          </v-chip>
          <v-spacer></v-spacer>
          <v-alert v-if="saveError" type="error" variant="tonal" density="compact" class="mr-4">
            {{ saveError }}
          </v-alert>
          <v-btn @click="showEditDialog = false" :disabled="saving">Cancel</v-btn>
          <v-btn color="primary" @click="saveRole" :loading="saving" :disabled="saving">Save Changes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirm Deletion</v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete this role?</p>
          <p><strong>{{ selectedRole?.name }}</strong></p>
          <v-alert v-if="saveError" type="error" variant="tonal" density="compact" class="mt-4">
            {{ saveError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDeleteDialog = false" :disabled="saving">Cancel</v-btn>
          <v-btn color="error" @click="confirmDelete" :loading="saving" :disabled="saving">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Permissões -->
    <v-dialog v-model="showPermissionsDialog" max-width="800px">
      <v-card>
        <v-card-title>Role Permissions: {{ selectedRole?.name }}</v-card-title>
        <v-card-text>
          <div v-if="selectedRole">
            <p><strong>Description:</strong> {{ selectedRole.description }}</p>
            <p><strong>Total Permissions:</strong> {{ selectedRole.permissionsCount }}</p>
            
            <div v-if="selectedRole.permissions && selectedRole.permissions.length > 0" class="mt-4">
              <h4>Permissions List:</h4>
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
              <p>No permissions found for this role.</p>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showPermissionsDialog = false">Close</v-btn>
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
