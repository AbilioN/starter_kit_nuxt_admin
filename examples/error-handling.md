# Tratamento de Erros - Sistema de Autenticação

## Como o Sistema Trata Erros da API

### 1. Estrutura de Erro da API

A API retorna erros no formato:
```json
{
    "message": "Invalid credentials"
}
```

### 2. Fluxo de Tratamento de Erro

```
API Error → ApiClient → AuthRepository → AuthService → Composable → Component
```

### 3. Captura de Erro no ApiClient

```typescript
// infrastructure/http/ApiClient.ts
if (!response.ok) {
  // Tentar extrair mensagem de erro da API
  if (isJson) {
    const errorData = await response.json() as ApiErrorResponse;
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  } else {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}
```

### 4. Propagação no AuthRepository

```typescript
// infrastructure/repositories/AuthRepository.ts
async login(email: string, password: string): Promise<LoginResponse> {
  const loginData: LoginRequest = { email, password };
  
  // Deixar o erro ser propagado para o serviço tratar
  const response = await this.apiClient.post<LoginResponse>('/login', loginData);
  return response;
}
```

### 5. Tratamento no AuthService

```typescript
// services/AuthService.ts
async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
  try {
    const response = await this.authRepository.login(email, password);
    // ... sucesso
  } catch (error) {
    // Capturar a mensagem específica de erro da API
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return {
      success: false,
      error: errorMessage // "Invalid credentials"
    };
  }
}
```

### 6. Exibição no Componente

```vue
<!-- components/auth/LoginForm.vue -->
<template>
  <v-alert type="error" variant="tonal" class="mb-3" v-if="errorMessage">
    <div class="d-flex align-center">
      <v-icon class="mr-2">mdi-alert-circle</v-icon>
      {{ errorMessage }} <!-- Exibe: "Invalid credentials" -->
    </div>
  </v-alert>
</template>
```

## Exemplos de Erros Tratados

### 1. Credenciais Inválidas
```json
// Resposta da API
{
    "message": "Invalid credentials"
}

// Exibido no formulário
"Invalid credentials"
```

### 2. Email Inválido
```json
// Resposta da API
{
    "message": "The email field must be a valid email address."
}

// Exibido no formulário
"The email field must be a valid email address."
```

### 3. Campos Obrigatórios
```json
// Resposta da API
{
    "message": "The email field is required."
}

// Exibido no formulário
"The email field is required."
```

### 4. Erro de Rede
```typescript
// Quando a API não está disponível
"Request timeout"
```

### 5. Erro de Servidor
```typescript
// Quando a API retorna 500
"HTTP error! status: 500"
```

## Testando o Tratamento de Erros

### 1. Credenciais Incorretas
```typescript
// Teste com email/senha errados
const result = await login('wrong@email.com', 'wrongpassword');
// Resultado: { success: false, error: "Invalid credentials" }
```

### 2. Email Inválido
```typescript
// Teste com email mal formatado
const result = await login('invalid-email', 'password');
// Resultado: { success: false, error: "The email field must be a valid email address." }
```

### 3. Campos Vazios
```typescript
// Teste com campos vazios
const result = await login('', '');
// Resultado: { success: false, error: "The email field is required." }
```

## Benefícios do Sistema de Tratamento

1. **Mensagens Específicas**: Exibe exatamente o que a API retorna
2. **UX Melhorada**: Usuário entende exatamente o que está errado
3. **Debugging Fácil**: Desenvolvedores podem identificar problemas rapidamente
4. **Internacionalização**: Fácil de traduzir mensagens se necessário
5. **Consistência**: Mesmo padrão de erro em toda a aplicação

## Configuração para Diferentes APIs

Se sua API retorna erros em formato diferente, basta ajustar a interface `ApiErrorResponse`:

```typescript
// Para APIs que retornam erros diferentes
interface ApiErrorResponse {
  message: string;
  error?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}
``` 