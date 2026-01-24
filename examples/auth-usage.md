# Exemplos de Uso - Sistema de Autenticação

## 1. Login Básico

```typescript
// Em um componente Vue
<script setup>
const { login, isAuthenticated } = useAuth();

const handleLogin = async () => {
  const result = await login('admin@letsjam.com', 'password');
  
  if (result.success) {
    console.log('Login realizado com sucesso!');
    // Redirecionamento automático para /dashboard
  } else {
    console.error('Erro no login:', result.error);
  }
};
</script>
```

## 2. Verificar Status de Autenticação

```typescript
// Em qualquer componente
<script setup>
const { isAuthenticated, user } = useAuth();

// Verificar se está logado
if (isAuthenticated.value) {
  console.log('Usuário logado:', user.value?.name);
} else {
  console.log('Usuário não logado');
}
</script>
```

## 3. Logout

```typescript
// Em um componente
<script setup>
const { logout } = useAuth();

const handleLogout = async () => {
  await logout();
  // Redirecionamento automático para /auth/login
};
</script>
```

## 4. Proteção de Rotas

```typescript
// Em uma página
<script setup>
definePageMeta({
  middleware: 'auth'
});

// A página só será acessível se o usuário estiver autenticado
</script>
```

## 5. Acesso aos Dados do Usuário

```typescript
// Em um componente
<template>
  <div v-if="user">
    <h1>Bem-vindo, {{ user.name }}!</h1>
    <p>Email: {{ user.email }}</p>
    <p>Status: {{ user.is_active ? 'Ativo' : 'Inativo' }}</p>
  </div>
</template>

<script setup>
const { user } = useAuth();
</script>
```

## 6. Tratamento de Erros

```typescript
// Exemplo completo de login com tratamento de erros
<script setup>
const { login } = useAuth();
const loading = ref(false);
const error = ref('');

const handleLogin = async (email: string, password: string) => {
  loading.value = true;
  error.value = '';
  
  try {
    const result = await login(email, password);
    
    if (result.success) {
      // Sucesso - redirecionamento automático
    } else {
      error.value = result.error || 'Erro desconhecido';
    }
  } catch (err) {
    error.value = 'Erro de conexão';
  } finally {
    loading.value = false;
  }
};
</script>
```

## 7. Middleware Personalizado

```typescript
// middleware/admin.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { checkAuth, user } = useAuth();
  
  const isAuthenticated = await checkAuth();
  
  if (!isAuthenticated) {
    return navigateTo('/auth/login');
  }
  
  // Verificar se o usuário é admin
  if (user.value && !user.value.is_active) {
    return navigateTo('/auth/login');
  }
});
```

## 8. Interceptor de Requisições

O sistema automaticamente:
- Adiciona o token Bearer em todas as requisições autenticadas
- Gerencia timeout de 10 segundos
- Trata erros de rede
- Limpa o token em caso de erro 401

## 9. Configuração de Ambiente

```typescript
// .env
NUXT_API_BASE_URL=http://localhost:8006/api/admin

// .env.production
NUXT_API_BASE_URL=https://api.letsjam.com/api/admin
```

## 10. Testando a API

Para testar com a API real:

1. Certifique-se de que a API está rodando em `http://localhost:8006`
2. Use as credenciais corretas (email e senha)
3. Verifique se o endpoint `/api/admin/login` está funcionando
4. Teste o endpoint `/api/admin/me` para verificar o token

### Exemplo de Resposta da API:

```json
{
  "admin": {
    "id": 1,
    "name": "Super Admin",
    "email": "admin@letsjam.com",
    "is_active": true,
    "last_login_at": null
  },
  "token": "1|WiUsXmc1nzyRcW5rdDwa5lz4zqESsU1okQ5AElECe62fdab5"
}
``` 