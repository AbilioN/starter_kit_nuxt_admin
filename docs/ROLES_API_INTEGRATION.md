# Integração com API de Roles

Este documento explica como a integração com a API de roles foi implementada.

## Estrutura da API

### Endpoint
```
GET /api/admin/roles
```

### Headers
```
Authorization: Bearer {token}
```

### Resposta
A API retorna um array direto de roles:

```json
[
  {
    "id": 1,
    "name": "Super Admin",
    "slug": "super-admin",
    "description": "System Super Administrator",
    "is_active": true,
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
    ],
    "created_at": "2025-10-05 13:40:02",
    "updated_at": "2025-10-05 13:40:02"
  }
]
```

## Implementação Frontend

### Tipos Atualizados

```typescript
export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

// A API retorna um array direto, não um objeto com paginação
export type RolesResponse = Role[];
```

### Repository

```typescript
async getRoles(): Promise<RolesResponse> {
  try {
    const response = await this.apiClient.get<RolesResponse>('/roles');
    return response;
  } catch (error) {
    console.error('Get roles failed:', error);
    throw new Error('Falha ao buscar roles');
  }
}
```

### Service

```typescript
async getRoles(): Promise<ApiResponse<RolesResponse>> {
  try {
    const response = await this.authRepository.getRoles();
    
    return {
      success: true,
      data: response,
      message: 'Roles carregados com sucesso'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return {
      success: false,
      error: errorMessage
    };
  }
}
```

### Composable

```typescript
export const useRoles = () => {
  const roles = ref<Role[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  const loadRoles = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await authService.getRoles();
      
      if (result.success && result.data) {
        roles.value = result.data;
      } else {
        error.value = result.error || 'Erro ao carregar roles';
      }
    } catch (err) {
      error.value = 'Erro inesperado ao carregar roles';
    } finally {
      loading.value = false;
    }
  };

  const formatRoleForDisplay = (role: Role) => {
    return {
      ...role,
      permissionsCount: role.permissions ? role.permissions.length : 0,
      createdDate: new Date(role.created_at).toLocaleDateString('pt-BR'),
      lastModified: new Date(role.updated_at).toLocaleDateString('pt-BR'),
      status: role.is_active ? 'Ativo' : 'Inativo',
      statusColor: role.is_active ? 'success' : 'error',
    };
  };

  const formattedRoles = computed(() => {
    return roles.value.map(formatRoleForDisplay);
  });

  return {
    roles: readonly(roles),
    loading: readonly(loading),
    error: readonly(error),
    formattedRoles,
    loadRoles,
    formatRoleForDisplay
  };
};
```

## Principais Mudanças

### 1. Remoção da Paginação
- A API retorna todos os roles de uma vez
- Removidas funções de paginação (`nextPage`, `prevPage`, etc.)
- Interface simplificada

### 2. Tipos Atualizados
- Adicionados campos `slug`, `is_active`, `created_at`, `updated_at`
- `RolesResponse` agora é um array direto
- Formatação de datas usando os campos reais da API

### 3. Interface da Página
- Removida seção de paginação
- Adicionado contador simples de total de roles
- Mantida funcionalidade de filtros e ações

## Como Testar

### 1. Console do Navegador
```javascript
// Verificar se a API está sendo chamada
debugAuth()

// Testar permissão para acessar roles
testPermission('role-assign')
```

### 2. Verificar no Network Tab
- Fazer login
- Acessar página `/roles`
- Verificar chamada para `/api/admin/roles`
- Confirmar headers de autorização

### 3. Verificar Dados Carregados
- Página deve mostrar os 3 roles: Super Admin, Administrator, User
- Super Admin deve ter 18 permissões
- Administrator deve ter 18 permissões  
- User deve ter 0 permissões

## Permissões Necessárias

Para acessar a página de roles, o usuário precisa ter:
- `role-assign` - Para ver o menu e acessar a página

Para ações específicas:
- `role-create` - Criar novos roles
- `role-update` - Editar roles existentes
- `role-delete` - Deletar roles
- `role-read` - Visualizar detalhes dos roles

## Exemplo de Uso

```vue
<template>
  <div>
    <h1>Roles do Sistema</h1>
    
    <div v-if="loading">
      Carregando roles...
    </div>
    
    <div v-else-if="error">
      Erro: {{ error }}
    </div>
    
    <div v-else>
      <div v-for="role in formattedRoles" :key="role.id">
        <h3>{{ role.name }}</h3>
        <p>{{ role.description }}</p>
        <p>Status: {{ role.status }}</p>
        <p>Permissões: {{ role.permissionsCount }}</p>
        <p>Criado em: {{ role.createdDate }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const { formattedRoles, loading, error, loadRoles } = useRoles()

onMounted(() => {
  loadRoles()
})
</script>
```
