# Sistema de Permissões e Super Admin

Este documento explica como usar o sistema de permissões implementado no dashboard.

## Visão Geral

O sistema de permissões permite controlar o acesso a diferentes funcionalidades baseado no tipo de usuário (admin/super admin) e suas permissões específicas.

## Estrutura de Dados

### Resposta do Login
```typescript
{
  "admin": {
    "id": 2,
    "name": "Secondary Admin",
    "email": "admin2@dashboard.com",
    "is_active": true,
    "is_super_admin": false,
    "last_login_at": null
  },
  "token": "8|9SqDoH3lqXPsaRDnFJeINrGSyZezLwnXdHgyDlBL0e672690",
  "permissions": [
    {
      "id": 1,
      "name": "Create Administrator",
      "slug": "admin-create",
      "description": "Allows creating new administrators",
      "is_active": true,
      "resource": "admin",
      "action": "create",
      "route": null
    }
    // ... mais permissões
  ]
}
```

## Composables Disponíveis

### useAuth()
Gerencia a autenticação do usuário e integra com o sistema de permissões.

```typescript
const { user, isAuthenticated, login, logout } = useAuth()
```

### usePermissions()
Gerencia permissões e verificações de acesso.

```typescript
const { 
  permissions,           // Array de permissões do usuário
  isSuperAdmin,         // Boolean indicando se é super admin
  hasPermission,        // Função para verificar permissão específica
  canAccess,           // Função para verificar acesso por recurso/ação
  hasAllPermissions,   // Função para verificar múltiplas permissões (AND)
  hasAnyPermission,    // Função para verificar pelo menos uma permissão (OR)
  getPermissionsByResource, // Função para obter permissões por recurso
  getPermissionsByAction,   // Função para obter permissões por ação
} = usePermissions()
```

## Exemplos de Uso

### 1. Verificar Permissão Específica
```vue
<template>
  <v-btn v-if="hasPermission('admin-create')" @click="createAdmin">
    Criar Administrador
  </v-btn>
</template>

<script setup>
const { hasPermission } = usePermissions()
</script>
```

### 2. Verificar Acesso por Recurso e Ação
```vue
<template>
  <div v-if="canAccess('user', 'read')">
    <!-- Conteúdo que só usuários com permissão de leitura podem ver -->
  </div>
</template>

<script setup>
const { canAccess } = usePermissions()
</script>
```

### 3. Verificar Múltiplas Permissões
```vue
<template>
  <div v-if="hasAllPermissions(['admin-create', 'admin-read'])">
    <!-- Conteúdo que requer AMBAS as permissões -->
  </div>
  
  <div v-if="hasAnyPermission(['chat-manage', 'chat-read'])">
    <!-- Conteúdo que requer pelo menos UMA das permissões -->
  </div>
</template>

<script setup>
const { hasAllPermissions, hasAnyPermission } = usePermissions()
</script>
```

### 4. Proteção de Rotas
```typescript
// middleware/permissions.ts
export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()
  const { hasPermission, isSuperAdmin } = usePermissions()

  if (!isAuthenticated.value) {
    return navigateTo('/auth/login')
  }

  // Super admin tem acesso a tudo
  if (isSuperAdmin.value) {
    return
  }

  // Verificar permissões específicas da rota
  const requiredPermissions = ['user-read'] // exemplo
  const hasRequiredPermission = requiredPermissions.some(permission => 
    hasPermission(permission)
  )

  if (!hasRequiredPermission) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Acesso negado'
    })
  }
})
```

### 5. Usar em Páginas
```vue
<!-- pages/users/index.vue -->
<template>
  <div>
    <h1>Usuários</h1>
    
    <!-- Botão só aparece se tiver permissão -->
    <v-btn v-if="hasPermission('user-create')" @click="createUser">
      Criar Usuário
    </v-btn>
    
    <!-- Lista só aparece se tiver permissão de leitura -->
    <div v-if="canAccess('user', 'read')">
      <!-- Lista de usuários -->
    </div>
  </div>
</template>

<script setup>
// Definir middleware para proteger a página
definePageMeta({
  middleware: 'permissions'
})

const { hasPermission, canAccess } = usePermissions()
</script>
```

## Persistência de Dados

O sistema salva automaticamente no localStorage:
- Dados do usuário (`user`)
- Token de autenticação (`token`)
- Permissões (`permissions`)
- Status de super admin (`isSuperAdmin`)

## Super Admin

Usuários com `is_super_admin: true` têm acesso a todas as funcionalidades, independentemente das permissões específicas.

## Recursos e Ações

O sistema organiza permissões por:
- **Resource**: O recurso (admin, user, chat, role)
- **Action**: A ação (create, read, update, delete, manage)

Exemplos de slugs de permissão:
- `admin-create`: Criar administrador
- `user-read`: Ler usuários
- `chat-manage`: Gerenciar chat
- `role-assign`: Atribuir roles
