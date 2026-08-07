# Prompt: Tela de "workspace suspenso" (Nuxt)

> Preparado na sessão coordenadora (`starter_kit`) em 2026-08-07. Cole este arquivo inteiro numa sessão Claude aberta em `starter_kit_frontend`. O backend já está pronto — nada aqui exige tocar em `starter_kit_backend`.

## Contexto

Quando o GodAdmin suspende um tenant (`/god/tenants/{id}` → botão Suspend), toda requisição subsequente à API para o subdomínio daquele tenant passa a retornar:

```json
// HTTP 403, de QUALQUER endpoint sob tenant.identify (ou seja, praticamente tudo)
{ "message": "Tenant suspended.", "error": "tenant_suspended" }
```

O campo `error` é novo (adicionado especificamente pra isso) — use-o pra detectar esse caso, não faça string-match em `message` (esse é texto livre, pode mudar).

Hoje isso não é tratado em lugar nenhum no frontend, e investigamos dois pontos reais onde isso quebra de forma confusa:

1. **`composables/useTenantTheme.ts`** (por volta da linha 38) — o fetch do tema (`GET /api/tenant/theme`, chamado em `layouts/blank.vue` e `layouts/default.vue` no `onMounted`) tem um `catch { }` vazio com o comentário "Non-critical — branding is a progressive enhancement, never block the app on it." Isso engole o erro 403 de tenant suspenso **silenciosamente** — quem visita um tenant suspenso só vê uma página sem branding, sem nenhuma pista do que aconteceu.
2. **`services/AuthService.ts`** → `login()` — captura qualquer erro e retorna `{ success: false, message: errorMessage }`. Se o usuário tentar logar mesmo assim, "Tenant suspended." aparece como se fosse qualquer outro erro de login (ex: senha errada), sem destaque nem clareza.

`infrastructure/http/ApiClient.ts` já tem um precedente pra esse tipo de tratamento especial: no método `request()`, uma resposta 401 já dispara um hard-redirect pra `/auth/login` (com stash em `sessionStorage` pra debug — ver o bloco `if (response.status === 401)`). Queremos o mesmo tipo de tratamento centralizado, mas pra esse novo caso 403+`tenant_suspended`.

## O que construir

1. **Nova página** `pages/suspended.vue` (ou nome parecido) — layout `public` (já existe, ver `layouts/public.vue`, não busca tema de tenant). Mensagem clara tipo "Este workspace foi suspenso. Entre em contato com o suporte." — sem CTA de login/pricing, não há nada acionável aqui pelo visitante.
2. **Helper compartilhado** em `utils/tenant.ts` (ou onde fizer mais sentido no projeto), algo como:
   ```ts
   export const isTenantSuspendedError = (payload: unknown): boolean =>
     typeof payload === 'object' && payload !== null && (payload as any).error === 'tenant_suspended';
   ```
   Precisa ser reaproveitável pelos DOIS caminhos de HTTP que existem no projeto (ver ponto 3), já que eles não compartilham a mesma lógica de fetch hoje.
3. **Dois pontos de interceptação** (não dá pra resolver só num lugar, já que são dois clientes HTTP diferentes):
   - `infrastructure/http/ApiClient.ts` → `request()`: ao lado do bloco `if (response.status === 401)`, adicionar tratamento equivalente pra `response.status === 403` + corpo com `error === 'tenant_suspended'` → redirect (`window.location.href`) pra `/suspended`.
   - `infrastructure/repositories/TenantRepository.ts` → `getTheme()`: usa `$fetch` cru (não passa pelo `ApiClient`), então precisa do próprio tratamento — `$fetch` (ofetch) lança um erro com o corpo parseado em `error.data` (mesmo padrão já usado em `pages/auth/forgot-password.vue`/`reset-password.vue` com `err?.data?.message`). Detectar `tenant_suspended` aí e redirecionar também.
4. **Corrigir o swallow silencioso** em `composables/useTenantTheme.ts`: o `catch` vazio precisa checar se é esse erro específico antes de decidir engolir — se for `tenant_suspended`, deixa propagar (ou já redireciona ali mesmo, se for mais simples resolver no repository).

## Decisão em aberto (escolha uma abordagem e documente a escolha)

Onde exatamente disparar o redirect: centralizado nos dois pontos de interceptação HTTP (ApiClient + TenantRepository), ou um interceptor mais global tipo um middleware Nuxt (`middleware/tenant-suspended.global.ts`) que roda antes de cada navegação e checa algum estado? A primeira opção é mais simples e seguce o precedente já existente (401 já funciona assim); recomendo começar por ela.

## Verificação

1. Suba o backend (`docker compose up -d`) e o Nuxt (`npm run dev`).
2. Via GodAdmin (`/god/tenants/{id}`), suspenda um tenant que tenha pelo menos um admin (ex: `tenant-a` do seed local).
3. Acesse esse tenant no Nuxt (subdomínio real ou `?tenant=tenant-a` conforme seu modo local) — tanto direto na home quanto tentando logar.
4. Confirme que aparece a tela de "workspace suspenso" em vez de: página sem branding sem explicação, ou erro de login genérico.
5. Reative o tenant e confirme que o fluxo normal volta a funcionar.

## Referência

Testes de backend cobrindo o lado da API (já passam, não precisa mexer): `starter_kit_backend/tests/Feature/Landlord/TenantSuspensionNotificationTest.php::test_suspended_tenant_requests_get_a_machine_readable_error_code`.
