# Sistema de Roles e Permissões

Este documento explica como usar o sistema de roles implementado no dashboard.

## Visão Geral

O sistema agora funciona com **Roles** que contêm **Permissões**. As permissões são extraídas automaticamente dos roles do usuário.

## Nova Estrutura de Dados

### Resposta do Login
```typescript
{
  "admin": {
    "id": 2,
    "name": "Secondary Admin",
    "email": "admin2@dashboard.com",
    "is_active": true,
    "is_super_admin": false,
    "last_login_at": "2025-10-05 21:59:57"
  },
  "token": "12|xvNkgbIuNjPBKTrQLsgSatGBtRzAq4JU1N5fur5g70376747",
  "roles": [
    {
      "id": 2,
      "name": "Administrator",
      "description": "System Administrator",
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
  ]
}
```

## Composables Atualizados

### usePermissions()
Agora inclui funções para trabalhar com roles:

```typescript
const { 
  // Estados
  permissions,           // Array de permissões extraídas dos roles
  roles,                // Array de roles do usuário
  isSuperAdmin,         // Boolean indicando se é super admin
  
  // Funções de permissões (inalteradas)
  hasPermission,        // Verificar permissão específica
  canAccess,           // Verificar acesso por recurso/ação
  hasAllPermissions,   // Verificar múltiplas permissões (AND)
  hasAnyPermission,    // Verificar pelo menos uma permissão (OR)
  
  // Novas funções de roles
  hasRole,             // Verificar se tem um role específico
  getRoleNames,        // Obter nomes de todos os roles
  getPermissionsByRole, // Obter permissões de um role específico
  
  // Funções de gerenciamento
  setRoles,            // Definir roles (nova função principal)
  setPermissions,      // Definir permissões diretamente (compatibilidade)
  clearPermissions,    // Limpar tudo
  loadPermissionsFromStorage // Carregar do localStorage
} = usePermissions()
```

## Exemplos de Uso

### 1. Verificar Permissões (Funciona Igual)
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

### 2. Verificar Roles (Novo)
```vue
<template>
  <div v-if="hasRole('Administrator')">
    <!-- Conteúdo só para administradores -->
  </div>
  
  <div v-if="hasRole('Manager')">
    <!-- Conteúdo só para managers -->
  </div>
</template>

<script setup>
const { hasRole } = usePermissions()
</script>
```

### 3. Listar Roles do Usuário
```vue
<template>
  <div>
    <h3>Roles do Usuário:</h3>
    <v-chip 
      v-for="roleName in getRoleNames()" 
      :key="roleName"
      class="mr-2 mb-2"
    >
      {{ roleName }}
    </v-chip>
  </div>
</template>

<script setup>
const { getRoleNames } = usePermissions()
</script>
```

### 4. Verificar Permissões de um Role Específico
```vue
<template>
  <div>
    <h3>Permissões do Role Administrator:</h3>
    <v-chip 
      v-for="permission in getPermissionsByRole('Administrator')" 
      :key="permission.id"
      class="mr-2 mb-2"
    >
      {{ permission.name }}
    </v-chip>
  </div>
</template>

<script setup>
const { getPermissionsByRole } = usePermissions()
</script>
```

### 5. Proteção de Rotas com Roles
```typescript
// middleware/permissions.ts
export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()
  const { hasRole, isSuperAdmin } = usePermissions()

  if (!isAuthenticated.value) {
    return navigateTo('/auth/login')
  }

  // Super admin tem acesso a tudo
  if (isSuperAdmin.value) {
    return
  }

  // Verificar roles específicos para rotas
  const routeRoles: Record<string, string[]> = {
    '/admins': ['Administrator', 'SuperAdmin'],
    '/users': ['Administrator', 'Manager'],
    '/reports': ['Administrator', 'Manager', 'Viewer']
  }

  const requiredRoles = routeRoles[to.path]
  
  if (requiredRoles) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role))
    
    if (!hasRequiredRole) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Acesso negado. Role insuficiente.'
      })
    }
  }
})
```

## Funções de Debug Atualizadas

### Console do Navegador
```javascript
// Ver todos os dados
debugAuth()        // Inclui roles agora

// Ver localStorage
debugStorage()     // Inclui roles salvos

// Testar permissões
testPermission('admin-create')

// Novas funções para roles
testRole('Administrator')    // Testar role específico
listRoles()                  // Listar todos os roles
```

## Persistência de Dados

O sistema salva automaticamente no localStorage:
- `user` - Dados do usuário
- `token` - Token de autenticação
- `roles` - **Novo**: Array de roles
- `permissions` - Permissões extraídas dos roles
- `isSuperAdmin` - Status de super admin

## Compatibilidade

O sistema mantém compatibilidade com a estrutura antiga:
- Se a resposta do login tiver `roles`, usa o novo sistema
- Se não tiver `roles`, usa o sistema antigo de permissões diretas

## Super Admin

Usuários com `is_super_admin: true` têm acesso a todas as funcionalidades, independentemente dos roles ou permissões.

## Vantagens do Sistema de Roles

1. **Organização**: Permissões agrupadas por role
2. **Flexibilidade**: Fácil de gerenciar roles complexos
3. **Escalabilidade**: Suporta múltiplos roles por usuário
4. **Manutenibilidade**: Mudanças em roles afetam todos os usuários
5. **Auditoria**: Fácil de rastrear quem tem quais roles
