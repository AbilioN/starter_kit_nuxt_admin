# Bug: canal privado do Pusher nunca autenticava (mensagens não chegavam em tempo real)

**Created:** 2026-08-10
**Status:** ✅ RESOLVED
**Sintoma relatado:** "estou enviando mensagem e não estou recebendo nada" (chat com agente de IA) — mensagem e resposta da IA ficavam salvas certinho no backend (confirmado via log/DB), mas nunca apareciam ao vivo no navegador.
**Purpose:** Documento autocontido. Leia sem precisar do contexto da sessão que o gerou.

---

## Causa raiz

`plugins/echo.client.ts` montava o `authEndpoint` do Laravel Echo assim:

```ts
authEndpoint: `${config.public.apiBaseUrl}/broadcasting/auth`,
```

`config.public.apiBaseUrl` é um runtime config **estático** (`http://localhost:8006/api` por padrão), sem prefixo de subdomínio nem `?tenant=` — diferente de **todo o resto do app**, que passa por `ApiClient`/`getApiConfig()` e sempre carrega o tenant (via subdomínio em modo `subdomain`, ou `?tenant=` em modo `query`, ver `utils/tenant.ts`).

`pusher-js` faz sua própria requisição POST direto pra esse `authEndpoint` — não passa pelo `ApiClient`, então nunca herda a lógica de tenant. Toda vez que o navegador tentava assinar um canal privado (`chat.{chatId}` ou `user.admin.{id}`), a requisição batia sem nenhuma identificação de tenant, e o middleware `IdentifyTenant` do backend respondia:

```
404 {"message":"Tenant not found."}
```

A assinatura do canal falhava silenciosamente (Pusher/Echo não lança um erro visível pra isso por padrão) — o app continuava funcionando normalmente pra tudo que não depende de tempo real (mensagem enviada, chat listado, etc.), só nunca recebia nada via push.

## Reprodução (confirmada via curl, sem browser)

```bash
TOKEN="<sanctum token de um admin>"
# Exatamente como o Echo chamava antes do fix - sem ?tenant=, sem subdomínio:
curl -i "http://localhost:8006/api/broadcasting/auth" -X POST \
  -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
  -d "socket_id=123.456" -d "channel_name=private-chat.<chatId>"
# -> 404 {"message":"Tenant not found."}

# Com o tenant identificado (o que o fix passou a fazer):
curl -i "http://localhost:8006/api/broadcasting/auth?tenant=<subdomain>" -X POST \
  -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
  -d "socket_id=123.456" -d "channel_name=private-chat.<chatId>"
# -> 200 {"auth":"<key>:<signature>"}
```

## Fix

`plugins/echo.client.ts` agora constrói o `authEndpoint` com o mesmo mecanismo tenant-aware usado em todo o resto do app:

```ts
import { getApiConfig } from '~/config/api';
import { appendTenantQueryParam } from '~/utils/tenant';
// ...
const { publicBaseURL, tenantQueryParam } = getApiConfig();
const authEndpoint = appendTenantQueryParam(`${publicBaseURL}/broadcasting/auth`, tenantQueryParam);
```

Em modo `subdomain` (produção), `publicBaseURL` já vem com o subdomínio prefixado — resolve sozinho. Em modo `query` (dev local sem DNS wildcard), `tenantQueryParam` adiciona `?tenant=`.

## Consequência prática pra depuração

Plugins do Nuxt rodam **uma vez**, no boot do app — trocar de tenant/token depois de já carregado não reconstrói o Echo automaticamente. Depois de qualquer mudança neste plugin (ou de logar como um tenant diferente em dev), **dê refresh completo na aba**, não confie em HMR sozinho pra revalidar a conexão de broadcasting.

## Por que isso não foi pego antes

Não existe teste automatizado nem ferramenta de browser automation neste projeto/sessão cobrindo o handshake real de canal privado do Pusher — é inerentemente um fluxo client-side (pusher-js rodando no navegador) que a suíte PHPUnit do backend não exercita, e o frontend não tem testes e2e configurados. A única forma de pegar isso foi reproduzir a chamada exata via curl, comparando com o que o resto do app faz.
