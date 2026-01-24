<template>
  <v-card class="debug-panel" v-if="showDebug">
    <v-card-title class="d-flex justify-space-between align-center">
      <span>🐛 Debug Panel</span>
      <v-btn icon="mdi-close" variant="text" @click="toggleDebug"></v-btn>
    </v-card-title>
    
    <v-card-text>
      <v-expansion-panels>
        <!-- User Data -->
        <v-expansion-panel>
          <v-expansion-panel-title>👤 User Data</v-expansion-panel-title>
          <v-expansion-panel-text>
            <pre class="debug-json">{{ JSON.stringify(user, null, 2) }}</pre>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Permissions -->
        <v-expansion-panel>
          <v-expansion-panel-title>🔐 Permissions ({{ permissions.length }})</v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="mb-2">
              <strong>Super Admin:</strong> 
              <v-chip :color="isSuperAdmin ? 'success' : 'warning'" size="small">
                {{ isSuperAdmin ? 'Yes' : 'No' }}
              </v-chip>
            </div>
            <pre class="debug-json">{{ JSON.stringify(permissions, null, 2) }}</pre>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- LocalStorage -->
        <v-expansion-panel>
          <v-expansion-panel-title>💾 LocalStorage</v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="localStorage-data">
              <div class="mb-2">
                <strong>User:</strong>
                <pre class="debug-json">{{ localStorageUser }}</pre>
              </div>
              <div class="mb-2">
                <strong>Token:</strong>
                <pre class="debug-json">{{ localStorageToken ? 'Token exists' : 'No token' }}</pre>
              </div>
              <div class="mb-2">
                <strong>Permissions:</strong>
                <pre class="debug-json">{{ localStoragePermissions }}</pre>
              </div>
              <div class="mb-2">
                <strong>Super Admin:</strong>
                <pre class="debug-json">{{ localStorageSuperAdmin }}</pre>
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Permission Tests -->
        <v-expansion-panel>
          <v-expansion-panel-title>🧪 Permission Tests</v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="permission-tests">
              <div v-for="test in permissionTests" :key="test.name" class="mb-2">
                <strong>{{ test.name }}:</strong>
                <v-chip :color="test.result ? 'success' : 'error'" size="small">
                  {{ test.result ? '✅' : '❌' }}
                </v-chip>
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
const { user, isAuthenticated } = useAuth()
const { permissions, isSuperAdmin, hasPermission, canAccess } = usePermissions()

const showDebug = ref(false)

const toggleDebug = () => {
  showDebug.value = !showDebug.value
}

// Expor toggleDebug globalmente para fácil acesso
if (process.client) {
  (window as any).toggleDebug = toggleDebug
}

// Computed para dados do localStorage
const localStorageUser = computed(() => {
  if (process.client) {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  }
  return null
})

const localStorageToken = computed(() => {
  if (process.client) {
    return localStorage.getItem('token')
  }
  return null
})

const localStoragePermissions = computed(() => {
  if (process.client) {
    const perms = localStorage.getItem('permissions')
    return perms ? JSON.parse(perms) : null
  }
  return null
})

const localStorageSuperAdmin = computed(() => {
  if (process.client) {
    const superAdmin = localStorage.getItem('isSuperAdmin')
    return superAdmin ? JSON.parse(superAdmin) : null
  }
  return null
})

// Testes de permissão
const permissionTests = computed(() => [
  { name: 'admin-create', result: hasPermission('admin-create') },
  { name: 'user-read', result: hasPermission('user-read') },
  { name: 'chat-manage', result: hasPermission('chat-manage') },
  { name: 'canAccess(user, read)', result: canAccess('user', 'read') },
  { name: 'canAccess(admin, create)', result: canAccess('admin', 'create') },
  { name: 'isSuperAdmin', result: isSuperAdmin.value },
  { name: 'isAuthenticated', result: isAuthenticated.value },
])
</script>

<style scoped>
.debug-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 9999;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.debug-json {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
}

.localStorage-data {
  font-size: 12px;
}

.permission-tests {
  font-size: 12px;
}
</style>
