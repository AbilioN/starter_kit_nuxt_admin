<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import UserAvatar from '@/components/shared/UserAvatar.vue';

// Definir middleware de autenticação
definePageMeta({
  middleware: 'auth'
});

const { t } = useI18n();

// Usar o composable de usuários
const {
  formattedUsers,
  pagination,
  loading,
  error,
  loadUsers,
  nextPage,
  prevPage,
  goToPage,
  changePerPage,
  canGoNext,
  canGoPrev,
  pageNumbers
} = useUsers();

// Estados reativos para filtros
const search = ref('');
const selectedStatus = ref('all');
const selectedRole = ref('all');
const selectedDepartment = ref('all');
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedUser = ref<any>(null);

// Estados do chat
const showChatDialog = ref(false);
const selectedChatUser = ref<any>(null);

// Filtros disponíveis
const statusOptions = computed(() => [
  { value: 'all', label: t('pages.users.allStatuses') },
  { value: 'Ativo', label: t('pages.users.statusActive') },
  { value: 'Pendente', label: t('pages.users.statusPending') }
]);

const roleOptions = computed(() => [
  { value: 'all', label: t('pages.users.allRoles') },
  { value: 'User', label: 'User' }
]);

const departmentOptions = computed(() => [
  { value: 'all', label: t('pages.users.allDepartments') },
  { value: 'TI', label: 'TI' }
]);

// Computed para filtrar usuários
const filteredUsers = computed(() => {
  return formattedUsers.value.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.value.toLowerCase()) ||
                         user.email.toLowerCase().includes(search.value.toLowerCase());
    const matchesStatus = selectedStatus.value === 'all' || user.status === selectedStatus.value;
    const matchesRole = selectedRole.value === 'all' || user.role === selectedRole.value;
    const matchesDepartment = selectedDepartment.value === 'all' || user.department === selectedDepartment.value;
    
    return matchesSearch && matchesStatus && matchesRole && matchesDepartment;
  });
});

// Funções de ação
const addUser = () => {
  showAddDialog.value = true;
};

const editUser = (user: any) => {
  selectedUser.value = { ...user };
  showEditDialog.value = true;
};

const deleteUser = (user: any) => {
  selectedUser.value = user;
  showDeleteDialog.value = true;
};

const confirmDelete = () => {
  if (selectedUser.value) {
    // Aqui você implementaria a chamada para deletar na API
    showDeleteDialog.value = false;
    selectedUser.value = null;
    // Recarregar usuários após deletar
    loadUsers(pagination.value?.current_page || 1, pagination.value?.per_page || 15);
  }
};

const toggleUserStatus = (user: any) => {
  // Aqui você implementaria a chamada para alterar status na API
  if (user.status === 'Ativo') {
    user.status = 'Pendente';
    user.statusColor = 'warning';
  } else {
    user.status = 'Ativo';
    user.statusColor = 'success';
  }
};

// Função para iniciar chat com usuário
const startChat = async (user: any) => {
  console.log('Iniciando chat com usuário:', user);
  selectedChatUser.value = user;
  showChatDialog.value = true;
};

const clearFilters = () => {
  search.value = '';
  selectedStatus.value = 'all';
  selectedRole.value = 'all';
  selectedDepartment.value = 'all';
};

// Carregar usuários quando a página for montada
onMounted(() => {
  loadUsers();
});
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">{{ t('pages.users.title') }}</h1>
            <p class="text-body-1 text-medium-emphasis">
              {{ t('pages.users.subtitle') }}
            </p>
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="addUser"
            size="large"
          >
            {{ t('pages.users.addUser') }}
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-row class="mb-6">
      <v-col cols="12">
        <UiChildCard :title="t('pages.users.filters')">
          <v-row>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="search"
                :label="t('pages.users.searchPlaceholder')"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" md="3">
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
            <v-col cols="12" md="3">
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
            <v-col cols="12" md="3">
              <v-select
                v-model="selectedDepartment"
                :items="departmentOptions"
                item-title="label"
                item-value="value"
                :label="t('pages.users.tableDepartment')"
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
                  {{ t('pages.users.usersFound', { count: filteredUsers.length }) }}
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

    <!-- Tabela de Usuários -->
    <v-row v-else>
      <v-col cols="12">
        <UiChildCard :title="t('pages.users.listTitle')">
          <v-table fixed-header height="600px">
            <thead>
              <tr>
                <th class="text-left">{{ t('pages.users.tableUser') }}</th>
                <th class="text-left">{{ t('common.labels.email') }}</th>
                <th class="text-left">{{ t('common.labels.role') }}</th>
                <th class="text-left">{{ t('pages.users.tableDepartment') }}</th>
                <th class="text-left">{{ t('common.labels.status') }}</th>
                <th class="text-left">{{ t('common.labels.lastLogin') }}</th>
                <th class="text-left">{{ t('common.labels.createdAt') }}</th>
                <th class="text-center">{{ t('common.labels.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>
                  <div class="d-flex align-center">
                    <UserAvatar :name="user.name" :size="40" class="mr-3" />
                    <div>
                      <div class="font-weight-medium">{{ user.name }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ user.email }}</td>
                <td>
                  <v-chip
                    :color="user.role === 'Admin' ? 'error' : user.role === 'Manager' ? 'warning' : user.role === 'Editor' ? 'info' : 'default'"
                    variant="tonal"
                    size="small"
                  >
                    {{ user.role }}
                  </v-chip>
                </td>
                <td>{{ user.department }}</td>
                <td>
                  <v-chip
                    :color="user.statusColor"
                    variant="tonal"
                    size="small"
                  >
                    {{ user.status }}
                  </v-chip>
                </td>
                <td>{{ user.lastLogin }}</td>
                <td>{{ new Date(user.created_at).toLocaleDateString('pt-BR') }}</td>
                <td>
                  <div class="d-flex justify-center gap-1">
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="info"
                      @click="startChat(user)"
                      :title="t('pages.users.startChat')"
                    >
                      <v-icon>mdi-chat</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click="editUser(user)"
                      :title="t('common.actions.edit')"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      :color="user.status === 'Ativo' ? 'warning' : 'success'"
                      @click="toggleUserStatus(user)"
                      :title="user.status === 'Ativo' ? t('common.actions.deactivate') : t('common.actions.activate')"
                    >
                      <v-icon>{{ user.status === 'Ativo' ? 'mdi-account-off' : 'mdi-account-check' }}</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="error"
                      @click="deleteUser(user)"
                      :title="t('common.actions.delete')"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>

          <!-- Paginação -->
          <div v-if="pagination" class="d-flex align-center justify-space-between mt-4">
            <div class="text-body-2 text-medium-emphasis">
              {{ t('pages.users.showingRange', { from: pagination.from, to: pagination.to, total: pagination.total }) }}
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

    <!-- Dialog de Adicionar Usuário -->
    <v-dialog v-model="showAddDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5">
          {{ t('pages.users.addDialogTitle') }}
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis">
            {{ t('pages.users.addDialogBody') }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showAddDialog = false"
          >
            {{ t('common.actions.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            @click="showAddDialog = false"
          >
            {{ t('common.actions.create') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de Editar Usuário -->
    <v-dialog v-model="showEditDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5">
          {{ t('pages.users.editDialogTitle') }}
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis">
            {{ t('pages.users.editDialogBody') }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showEditDialog = false"
          >
            {{ t('common.actions.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            @click="showEditDialog = false"
          >
            {{ t('common.actions.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de Confirmação de Exclusão -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">
          {{ t('pages.users.deleteDialogTitle') }}
        </v-card-title>
        <v-card-text>
          <p class="text-body-2">
            {{ t('pages.users.deleteDialogBody', { name: selectedUser?.name }) }}
          </p>
          <p class="text-caption text-medium-emphasis">
            {{ t('pages.users.deleteDialogWarning') }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showDeleteDialog = false"
          >
            {{ t('common.actions.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            @click="confirmDelete"
          >
            {{ t('common.actions.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de Chat -->
    <v-dialog v-model="showChatDialog" max-width="800px" persistent>
      <v-card class="chat-dialog-card">
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <div class="d-flex align-center gap-3">
            <v-avatar size="40" color="primary">
              <v-icon>mdi-account</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6">{{ t('pages.users.chatWith', { name: selectedChatUser?.name }) }}</div>
              <div class="text-caption text-medium-emphasis">{{ selectedChatUser?.email }}</div>
            </div>
          </div>
          <v-btn
            icon
            variant="text"
            @click="showChatDialog = false"
            :title="t('common.actions.close')"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="chat-dialog-content pa-0">
          <ChatInterface
            v-if="selectedChatUser"
            :key="selectedChatUser.id"
            :initial-chat="null"
            :initial-user="selectedChatUser"
            @close="showChatDialog = false"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.chat-dialog-card {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.chat-dialog-content {
  flex: 1;
  overflow: hidden;
}
</style> 