# Integração do Pusher com o Sistema de Chat

## Visão Geral

O sistema de chat está integrado com o Pusher para fornecer funcionalidades em tempo real, incluindo:
- Recebimento automático de novas mensagens
- Atualização de status de leitura
- Notificações de usuários online/offline
- Indicadores de digitação

## Configuração

### Credenciais do Pusher
As credenciais estão configuradas centralmente em `config/pusher.ts` e são compatíveis com **Nuxt.js** e **Flutter**.

**Configuração Principal:**
```typescript
appId: '1553073',
appKey: 'b395ac035994ca7af583',
appSecret: '8a20e39fc3f1ab6111af',
cluster: 'eu',
host: '',
port: 443,
scheme: 'https'
```

**Para mais detalhes de configuração, consulte:** [`docs/PUSHER_CONFIGURATION.md`](./PUSHER_CONFIGURATION.md)

### Plugin Pusher
O plugin `echo.client.ts` configura o Pusher diretamente e fornece a instância globalmente.

## Eventos Suportados

### Mensagens
- **`MessageSent`**: Nova mensagem enviada
- **`MessageRead`**: Mensagem marcada como lida
- **`MessageDeleted`**: Mensagem deletada

### Chats
- **`ChatCreated`**: Novo chat criado
- **`ChatUpdated`**: Chat atualizado
- **`ChatDeleted`**: Chat deletado

### Usuários
- **`UserOnline`**: Usuário ficou online
- **`UserOffline`**: Usuário ficou offline
- **`UserTyping`**: Usuário está digitando
- **`UserStoppedTyping`**: Usuário parou de digitar

## Canais

### Canais de Chat (Principais)
- **`chat.{chatId}`**: Canal para mensagens de um chat específico (ex: `chat.33`)

### Canais Privados (Futuras funcionalidades)
- **`private-user.{userId}`**: Canal privado para mensagens do usuário
- **`private-chat.{chatId}`**: Canal privado para mensagens de um chat específico

### Canais Públicos (Futuras funcionalidades)
- **`public-chat.{chatId}`**: Canal público para informações do chat
- **`public-users`**: Canal público para status dos usuários

## Implementação no Frontend

### useChatManager
O composable `useChatManager` configura automaticamente os listeners do Pusher:

```typescript
// Configuração automática
onMounted(() => {
  setupPusherListener();
});

// Limpeza automática
onUnmounted(() => {
  cleanupPusherListener();
});
```

### Funcionalidades Automáticas
1. **Nova mensagem**: Adicionada automaticamente ao estado
2. **Atualização de chat**: Última mensagem e contador de não lidas
3. **Scroll automático**: Para o chat ativo
4. **Status de leitura**: Atualizado em tempo real

## Backend (Laravel)

### Broadcasting
Para que o sistema funcione, o backend deve implementar:

```php
// Evento de mensagem enviada
class MessageSent implements ShouldBroadcast
{
    public function broadcastOn()
    {
        return new Channel('chat.' . $this->message->chat_id);
    }
    
    public function broadcastAs()
    {
        return 'MessageSent';
    }
}

// Evento de mensagem lida
class MessageRead implements ShouldBroadcast
{
    public function broadcastOn()
    {
        return new Channel('chat.' . $this->message->chat_id);
    }
    
    public function broadcastAs()
    {
        return 'MessageRead';
    }
}
```

### Autenticação de Canais
O Laravel deve configurar a autenticação para canais privados:

```php
// routes/channels.php
// Canais públicos não precisam de autenticação
// Broadcast::channel('chat.{id}', function ($user, $id) {
//     return true; // Qualquer usuário pode escutar
// });

// Para canais privados futuros:
// Broadcast::channel('private-user.{id}', function ($user, $id) {
//     return (int) $user->id === (int) $id;
// });

// Broadcast::channel('private-chat.{id}', function ($user, $id) {
//     return $user->chats()->where('chat_id', $id)->exists();
// });
```

## Debug e Logs

O sistema inclui logs detalhados para debug:
- 🔔 Configuração do listener
- 🔔 Eventos recebidos
- 🔔 Mensagens adicionadas ao estado
- 🔔 Atualizações de chat
- 🔔 Limpeza de listeners

## Testando

1. **Verificar conexão**: Logs de configuração do Pusher
2. **Enviar mensagem**: De outro usuário/dispositivo
3. **Verificar recebimento**: Logs de evento recebido
4. **Verificar estado**: Mensagem deve aparecer automaticamente
5. **Verificar scroll**: Deve rolar para baixo automaticamente

## Troubleshooting

### Problemas Comuns
1. **Echo não disponível**: Verificar plugin echo.client.ts
2. **Canal não autorizado**: Verificar autenticação no backend
3. **Eventos não recebidos**: Verificar nomes dos eventos
4. **Mensagens não aparecem**: Verificar estrutura do evento

### Logs Úteis
- Console do navegador para logs do frontend
- Logs do Laravel para eventos broadcast
- Dashboard do Pusher para conexões
