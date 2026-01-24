<template>
  <v-fab
    v-if="isDev"
    icon="mdi-bug"
    color="primary"
    size="small"
    location="bottom end"
    style="bottom: 100px; right: 20px;"
    @click="showDebugData"
  />
</template>

<script setup lang="ts">
const { user } = useAuth()
const { permissions, roles, isSuperAdmin } = usePermissions()

const isDev = ref(process.dev)

const showDebugData = () => {
  console.log('🔐 AUTH DEBUG DATA:')
  console.log('==================')
  console.log('👤 User:', user.value)
  console.log('🎭 Roles:', roles.value)
  console.log('🔑 Permissions:', permissions.value)
  console.log('👑 Is Super Admin:', isSuperAdmin.value)
  console.log('==================')
  console.log('💾 LocalStorage:')
  console.log('User:', JSON.parse(localStorage.getItem('user') || 'null'))
  console.log('Token:', localStorage.getItem('token') ? '✅ Exists' : '❌ Missing')
  console.log('Roles:', JSON.parse(localStorage.getItem('roles') || 'null'))
  console.log('Permissions:', JSON.parse(localStorage.getItem('permissions') || 'null'))
  console.log('Super Admin:', JSON.parse(localStorage.getItem('isSuperAdmin') || 'null'))
  console.log('==================')
  
  // Também mostrar em um alert para fácil visualização
  const roleNames = roles.value.map(role => role.name).join(', ')
  alert(`🐛 DEBUG INFO:
  
👤 User: ${user.value?.name || 'Not logged in'}
📧 Email: ${user.value?.email || 'N/A'}
🎭 Roles: ${roleNames || 'No roles'}
👑 Super Admin: ${isSuperAdmin.value ? 'Yes' : 'No'}
🔐 Permissions: ${permissions.value.length} permissions

Check console for full details!`)
}
</script>
