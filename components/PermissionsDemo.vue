<template>
  <div class="permissions-demo">
    <v-card class="mb-4">
      <v-card-title>Status do Usuário</v-card-title>
      <v-card-text>
        <div v-if="user">
          <p><strong>Nome:</strong> {{ user.name }}</p>
          <p><strong>Email:</strong> {{ user.email }}</p>
          <p><strong>Super Admin:</strong> 
            <v-chip :color="isSuperAdmin ? 'success' : 'warning'">
              {{ isSuperAdmin ? 'Sim' : 'Não' }}
            </v-chip>
          </p>
        </div>
        <div v-else>
          <p>Usuário não logado</p>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="mb-4">
      <v-card-title>Verificação de Permissões</v-card-title>
      <v-card-text>
        <div class="permission-checks">
          <div class="mb-2">
            <v-chip 
              :color="hasPermission('admin-create') ? 'success' : 'error'"
              class="mr-2"
            >
              Admin Create: {{ hasPermission('admin-create') ? 'Sim' : 'Não' }}
            </v-chip>
          </div>
          
          <div class="mb-2">
            <v-chip 
              :color="canAccess('user', 'read') ? 'success' : 'error'"
              class="mr-2"
            >
              User Read: {{ canAccess('user', 'read') ? 'Sim' : 'Não' }}
            </v-chip>
          </div>
          
          <div class="mb-2">
            <v-chip 
              :color="hasAllPermissions(['admin-create', 'admin-read']) ? 'success' : 'error'"
              class="mr-2"
            >
              Admin Create + Read: {{ hasAllPermissions(['admin-create', 'admin-read']) ? 'Sim' : 'Não' }}
            </v-chip>
          </div>
          
          <div class="mb-2">
            <v-chip 
              :color="hasAnyPermission(['chat-manage', 'chat-read']) ? 'success' : 'error'"
              class="mr-2"
            >
              Chat Access: {{ hasAnyPermission(['chat-manage', 'chat-read']) ? 'Sim' : 'Não' }}
            </v-chip>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="mb-4">
      <v-card-title>Roles do Usuário</v-card-title>
      <v-card-text>
        <div v-if="roles.length > 0">
          <v-chip 
            v-for="role in roles" 
            :key="role.id"
            color="secondary"
            class="mr-2 mb-2"
          >
            {{ role.name }} ({{ role.permissions.length }} permissões)
          </v-chip>
        </div>
        <div v-else>
          <p>Nenhum role carregado</p>
        </div>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-title>Permissões Disponíveis</v-card-title>
      <v-card-text>
        <div v-if="permissions.length > 0">
          <v-chip 
            v-for="permission in permissions" 
            :key="permission.id"
            :color="permission.is_active ? 'primary' : 'grey'"
            class="mr-2 mb-2"
          >
            {{ permission.name }} ({{ permission.slug }})
          </v-chip>
        </div>
        <div v-else>
          <p>Nenhuma permissão carregada</p>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth()
const { 
  permissions, 
  roles,
  isSuperAdmin, 
  hasPermission, 
  canAccess, 
  hasAllPermissions, 
  hasAnyPermission,
  hasRole,
  getRoleNames
} = usePermissions()
</script>

<style scoped>
.permissions-demo {
  padding: 20px;
}

.permission-checks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
