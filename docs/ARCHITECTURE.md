# Arquitetura Limpa - Sistema de Autenticação

Este projeto implementa os princípios da Clean Architecture (Arquitetura Limpa) para o sistema de autenticação.

## Estrutura de Camadas

### 1. Presentation Layer (Camada de Apresentação)
- **Composables**: `composables/useAuth.ts`
- **Components**: Componentes Vue que usam o composable
- **Pages**: Páginas que implementam a interface do usuário

### 2. Application Layer (Camada de Aplicação)
- **Services**: `services/AuthService.ts`
- **Use Cases**: Lógica de negócio da aplicação
- **DTOs**: Objetos de transferência de dados

### 3. Domain Layer (Camada de Domínio)
- **Interfaces**: `types/domain.d.ts`
- **Entities**: `types/api.d.ts`
- **Business Rules**: Regras de negócio centrais

### 4. Infrastructure Layer (Camada de Infraestrutura)
- **Repositories**: `infrastructure/repositories/AuthRepository.ts`
- **HTTP Client**: `infrastructure/http/ApiClient.ts`
- **External APIs**: Comunicação com serviços externos

## Fluxo de Dados

```
Component → Composable → Service → Repository → HTTP Client → API
```

## Configuração

### API Configuration
- **Base URL**: `http://localhost:8006/api/admin`
- **Timeout**: 10 segundos
- **Endpoints**:
  - Login: `/login`
  - Logout: `/logout`
  - Me: `/me`

### Autenticação
- **Token Storage**: localStorage
- **Token Header**: `Authorization: Bearer {token}`
- **Auto-refresh**: Verificação automática de token válido

## Uso

### Login
```typescript
const { login } = useAuth();
const result = await login('admin@letsjam.com', 'password');
```

### Verificar Autenticação
```typescript
const { isAuthenticated } = useAuth();
if (isAuthenticated.value) {
  // Usuário está logado
}
```

### Logout
```typescript
const { logout } = useAuth();
await logout();
```

## Middleware

O middleware `auth.ts` protege as rotas automaticamente:
- Redireciona para `/auth/login` se não autenticado
- Redireciona para `/dashboard` se autenticado tentando acessar páginas de auth

## Benefícios da Arquitetura

1. **Separação de Responsabilidades**: Cada camada tem uma responsabilidade específica
2. **Testabilidade**: Fácil de testar cada camada isoladamente
3. **Manutenibilidade**: Mudanças em uma camada não afetam outras
4. **Escalabilidade**: Fácil de adicionar novas funcionalidades
5. **Independência de Framework**: Lógica de negócio independente do Vue/Nuxt 