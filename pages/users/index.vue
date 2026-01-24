<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';

// Definir middleware de autenticação
definePageMeta({
  middleware: 'auth'
});

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
const statusOptions = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'Ativo', label: 'Ativo' },
  { value: 'Pendente', label: 'Pendente' }
];

const roleOptions = [
  { value: 'all', label: 'Todos os Roles' },
  { value: 'User', label: 'User' }
];

const departmentOptions = [
  { value: 'all', label: 'Todos os Departamentos' },
  { value: 'TI', label: 'TI' }
];

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
            <h1 class="text-h4 font-weight-bold">Usuários</h1>
            <p class="text-body-1 text-medium-emphasis">
              Gerencie todos os usuários do sistema
            </p>
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="addUser"
            size="large"
          >
            Adicionar Usuário
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-row class="mb-6">
      <v-col cols="12">
        <UiChildCard title="Filtros">
          <v-row>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="search"
                label="Buscar por nome ou email"
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
                label="Status"
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
                label="Role"
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
                label="Departamento"
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
                  Limpar Filtros
                </v-btn>
                <v-chip
                  color="primary"
                  variant="tonal"
                  class="ml-auto"
                >
                  {{ filteredUsers.length }} usuários encontrados
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
        <UiChildCard title="Lista de Usuários">
          <v-table fixed-header height="600px">
            <thead>
              <tr>
                <th class="text-left">Usuário</th>
                <th class="text-left">Email</th>
                <th class="text-left">Role</th>
                <th class="text-left">Departamento</th>
                <th class="text-left">Status</th>
                <th class="text-left">Último Login</th>
                <th class="text-left">Criado em</th>
                <th class="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>
                  <div class="d-flex align-center">
                    <v-avatar size="40" class="mr-3">
                      <img :src="user.avatar" :alt="user.name" />
                    </v-avatar>
                    <div>
                      <div class="font-weight-medium">{{ user.name }}</div>
                      <div class="text-caption text-medium-emphasis">{{ user.phone }}</div>
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
                      title="Iniciar Chat"
                    >
                      <v-icon>mdi-chat</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click="editUser(user)"
                      title="Editar"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      :color="user.status === 'Ativo' ? 'warning' : 'success'"
                      @click="toggleUserStatus(user)"
                      :title="user.status === 'Ativo' ? 'Desativar' : 'Ativar'"
                    >
                      <v-icon>{{ user.status === 'Ativo' ? 'mdi-account-off' : 'mdi-account-check' }}</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="error"
                      @click="deleteUser(user)"
                      title="Excluir"
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
              Mostrando {{ pagination.from }} a {{ pagination.to }} de {{ pagination.total }} usuários
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
                title="Página anterior"
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
                title="Próxima página"
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
          Adicionar Novo Usuário
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis">
            Formulário de adição de usuário será implementado aqui.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showAddDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            @click="showAddDialog = false"
          >
            Adicionar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de Editar Usuário -->
    <v-dialog v-model="showEditDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5">
          Editar Usuário
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis">
            Formulário de edição será implementado aqui.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showEditDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            @click="showEditDialog = false"
          >
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de Confirmação de Exclusão -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">
          Confirmar Exclusão
        </v-card-title>
        <v-card-text>
          <p class="text-body-2">
            Tem certeza que deseja excluir o usuário <strong>{{ selectedUser?.name }}</strong>?
          </p>
          <p class="text-caption text-medium-emphasis">
            Esta ação não pode ser desfeita.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showDeleteDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            @click="confirmDelete"
          >
            Excluir
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
              <div class="text-h6">Chat com {{ selectedChatUser?.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ selectedChatUser?.email }}</div>
            </div>
          </div>
          <v-btn
            icon
            variant="text"
            @click="showChatDialog = false"
            title="Fechar"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="chat-dialog-content pa-0">
          <ChatInterface 
            v-if="selectedChatUser"
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