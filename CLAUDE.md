# CLAUDE.md — starter_kit_nuxt_admin

Este arquivo dá contexto de **arquitetura** e **convenções** para um assistente (Claude) trabalhar neste repositório com segurança, sem "quebrar o projeto" nem reinventar padrões já existentes.

## Visão geral rápida

- **Framework**: Nuxt 3 (Vue 3) com **SSR desativado** (`ssr: false`).
- **UI**: Vuetify 3 (plugin em `plugins/vuetify.ts`), com `vue3-perfect-scrollbar`.
- **Estado**: `useState()` do Nuxt para estados globais (não há `stores/` Pinia neste repo).
- **HTTP**: camada própria baseada em `fetch`:
  - `infrastructure/http/ApiClient.ts` (baseURL + headers + token + timeout)
  - `infrastructure/repositories/*` (endpoints/contratos)
  - `services/*` (orquestração + normalização de retorno)
  - `composables/use*.ts` (estado de tela + carregamento + paginação)
- **RBAC**: permissões + "super admin" em `composables/usePermissions.ts` e middleware.
- **Realtime/Chat**: Pusher plugin (`plugins/echo.client.ts`) + consumo via `useChat()` (usa `$echo`).

## Como o app "sobe" e roda

- `app.vue` renderiza `<NuxtLayout><NuxtPage/></NuxtLayout>`.
- Layout padrão: `layouts/default.vue`
  - Renderiza `LayoutMain` (drawer + topbar)
  - Renderiza o conteúdo via `<NuxtPage/>` dentro de um container Vuetify
  - Sempre inclui `ChatWidget` e `NotificationSnackbarSimple`
- Layout de auth: `layouts/blank.vue` (páginas de login/registro usam esse layout via `definePageMeta`).

### Configuração Nuxt

Arquivo: `nuxt.config.ts`

- **SPA**: `ssr: false`
- **Vuetify transpile**: `build.transpile: ["vuetify"]`
- **Nitro**: `serveStatic: true`
- **runtimeConfig.public**: chaves do Pusher (atenção: hoje há valores default hardcoded)

## Estrutura de pastas (o que fica onde)

- **`pages/`**: rotas (Nuxt file-based routing).
  - Ex.: `pages/dashboard/index.vue`, `pages/users/index.vue`, `pages/admins/index.vue`, `pages/roles/index.vue`, `pages/audit/*`, `pages/auth/*`
- **`layouts/`**: shells de UI.
  - `default.vue` (app autenticado), `blank.vue` (auth)
- **`middleware/`**: guardas de rota.
  - `auth.ts`: garante sessão (usa `useAuth().checkAuth()`)
  - `permissions.ts`: faz RBAC por rota (mapa estático `routePermissions`)
- **`components/`**: componentes visuais e de layout.
  - Menu lateral: `components/Layout/Full/vertical-sidebar/sidebarItem.ts` (inclui `permission?: string`)
- **`composables/`**: "view-models" de tela.
  - Ex.: `useUsers`, `useAdmins`, `useRoles`, `useAudit`, `useChat`, `useNotification`, `useAuth`, `usePermissions`
- **`services/`**: casos de uso/serviços de domínio (chamam repositórios).
  - `AuthService`, `AdminService`, `AuditService`, `ChatService`
- **`infrastructure/`**: acesso a dados.
  - `http/ApiClient.ts`: cliente HTTP base
  - `repositories/*`: endpoints e contratos com a API
- **`config/`**: configs centralizadas.
  - `config/api.ts`: baseURL e timeouts
  - `config/pusher.ts`: config do Pusher
- **`types/`**: tipos TS (`.d.ts` e módulos).

## Camadas e fluxo de dados (padrão atual)

Padrão recomendado (já adotado em boa parte do repo):

1. **Page (`pages/...`)**
   - Define `definePageMeta({ middleware: 'auth' })` quando precisa estar logado.
   - Usa composables (`useUsers`, `useAdmins`, etc).
2. **Composable (`composables/useX.ts`)**
   - Mantém `loading/error/pagination` e dados (ex.: `users`, `admins`, `logs`)
   - Chama um **Service**
3. **Service (`services/XService.ts`)**
   - Orquestra chamadas, adapta shape de resposta e trata erros
4. **Repository (`infrastructure/repositories/XRepository.ts`)**
   - Faz chamadas REST (paths) usando o `ApiClient`
5. **ApiClient (`infrastructure/http/ApiClient.ts`)**
   - `fetch(fullURL, { headers })` com:
     - `Authorization: Bearer <token>` se existir em `localStorage['auth_token']`
     - `Accept: application/json`
     - timeout via `AbortController`

## Autenticação (estado, token, middleware)

### Estado

Arquivo: `composables/useAuth.ts`

- `user`: `useState<Admin|null>('user')`
- `isAuthenticated`: `computed(() => !!user.value)`
- Login:
  - chama `AuthService.login(email, password)`
  - salva:
    - `localStorage['user'] = admin`
    - `localStorage['auth_token'] = token`
  - popula roles/permissões via `usePermissions().setRoles(...)` (quando `roles` vêm no payload)
- Check (para middleware):
  - carrega permissões do storage (`loadPermissionsFromStorage()`)
  - restaura `user` do storage
  - se houver token, tenta `authService.getCurrentUser()`

### Middleware de auth

Arquivo: `middleware/auth.ts`

- Se não autenticado e rota não é `/auth/login` nem `/auth/register`, redireciona para login.
- Se autenticado e tenta ir para `/auth/login` ou `/auth/register`, manda para `/dashboard`.

### Observações importantes (débitos técnicos / inconsistências)

- **Chaves de token divergentes**:
  - O token "certo" no código HTTP é `localStorage['auth_token']` (usado pelo `ApiClient` e pelo `AuthService`).
  - O `useAuth.logout()` remove `localStorage['token']` (provável bug: deveria remover `auth_token`).
  - `plugins/debug.client.ts` também lê `localStorage['token']` (provável bug).
- **`/me` e `/logout`**:
  - `config/api.ts` define `ENDPOINTS.ME='/me'` e `ENDPOINTS.LOGOUT='/logout'`.
  - O documento `docs/2026-04-29_ADMIN_PANEL_PROMPT.md` diz que **não existe** endpoint `/api/admin/me` e que logout server-side "não existe ainda".
  - Se o backend não expõe esses endpoints, `checkAuth()` só deve validar via algum endpoint autenticado real (ex.: `/dashboard`).

## Permissões (RBAC)

Arquivo: `composables/usePermissions.ts`

- Guarda:
  - `roles`: `useState<Role[]>('roles')`
  - `permissions`: `useState<Permission[]>('permissions')`
  - `isSuperAdmin`: `useState<boolean>('isSuperAdmin')`
- `hasPermission(slug)`:
  - retorna `true` se `isSuperAdmin`
  - senão verifica `permission.slug` + `permission.is_active`
- Persistência:
  - salva/recupera `roles`, `permissions`, `isSuperAdmin` do `localStorage`

### Middleware de permissões

Arquivo: `middleware/permissions.ts`

- Mapa estático por rota (`routePermissions: Record<string, string[]>`).
- Se rota exige permissão e usuário não é super admin e não tem nenhuma das permissões, lança erro 403.

### Menu lateral e permissões

Arquivo: `components/Layout/Full/vertical-sidebar/sidebarItem.ts`

- Alguns itens têm `permission: "user-read"`, etc.
- Importante: hoje isso é **metadado**; a renderização condicional depende de como `NavItem/NavCollapse` usam esse campo (verificar antes de alterar).

## Chat / Realtime

- Pusher plugin: `plugins/echo.client.ts`
  - injeta `provide: { pusher }`
- `useChat()` usa `const { $echo } = useNuxtApp()` para ouvir eventos.
- Config do Pusher:
  - `config/pusher.ts` (tem chaves hardcoded)
  - `nuxt.config.ts` também define chaves em `runtimeConfig.public` (com defaults)

## Configuração de API (backend)

Arquivo: `config/api.ts`

- `API_CONFIG.BASE_URL = 'http://localhost:8006/api/admin'`
- `getApiConfig()` usa `process.env.NUXT_API_BASE_URL || API_CONFIG.BASE_URL`

Recomendação prática ao mexer:

- Preferir passar baseURL por env (`NUXT_API_BASE_URL`) em dev/CI.
- Para Nuxt, o padrão mais "Nuxt way" é `runtimeConfig.public.apiBaseUrl`, mas hoje o projeto usa `process.env` diretamente — mantenha consistente ao implementar novas configs.

## Convenções ao implementar features novas

- **Novo endpoint**:
  - criar/estender `infrastructure/repositories/<X>Repository.ts`
  - expor no `services/<X>Service.ts`
  - consumir via `composables/use<X>.ts`
  - usar na `page`/`component`
- **Novo módulo/página**:
  - criar rota em `pages/...`
  - aplicar `definePageMeta({ middleware: 'auth' })` (e `permissions` se quiser RBAC por rota)
  - adicionar item no `sidebarItem.ts` com `permission` correspondente
- **Tratamento de erros**:
  - manter o padrão `loading/error` nos composables
  - `ApiClient` já transforma erros HTTP em `Error(message)` (quando resposta é JSON e tem `message`)
- **Não mudar stack sem motivo**:
  - já há Vuetify + composição de layout; evite introduzir outra lib de UI.

## Guardrails (o que NÃO fazer sem intenção explícita)

- Não reestruturar de `fetch`/repositories para `$fetch`/useFetch "do nada".
- Não habilitar SSR (o app está desenhado como SPA).
- Não hardcodar chaves/segredos novos no repo. Hoje já existem valores default em Pusher — se for ajustar, migrar para env/runtimeConfig e remover defaults.
- Não acoplar permissões em strings espalhadas por todo lugar: centralizar no middleware/constantes quando possível.

## Comandos úteis

```bash
npm install
npm run dev
npm run build
```
