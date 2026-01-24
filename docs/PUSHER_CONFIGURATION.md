# Configuração do Pusher

## Visão Geral

Este documento descreve a configuração centralizada do Pusher para o sistema de chat, compatível com **Nuxt.js** e **Flutter**.

## Credenciais

### Configuração Principal
```typescript
export const PUSHER_CONFIG = {
  appId: '1553073',
  appKey: 'b395ac035994ca7af583',
  appSecret: '8a20e39fc3f1ab6111af',
  cluster: 'eu',
  host: '',
  port: 443,
  scheme: 'https',
  forceTLS: true,
  encrypted: true
}
```

### Configuração para Cliente
```typescript
export const PUSHER_CONFIG = {
  clientAppKey: 'b395ac035994ca7af583',
  clientCluster: 'eu',
  clientHost: null,
  clientPort: 443,
  clientScheme: 'https'
}
```

## Implementação por Plataforma

### Nuxt.js (Frontend Web)

#### 1. Configuração no nuxt.config.ts
```typescript
runtimeConfig: {
  public: {
    pusherKey: process.env.PUSHER_APP_KEY || 'b395ac035994ca7af583',
    pusherCluster: process.env.PUSHER_APP_CLUSTER || 'eu',
    pusherAppId: process.env.PUSHER_APP_ID || '1553073',
    pusherSecret: process.env.PUSHER_APP_SECRET || '8a20e39fc3f1ab6111af'
  }
}
```

#### 2. Plugin Echo (plugins/echo.client.ts)
```typescript
import { getPusherConfig } from '~/config/pusher';

const pusherConfig = getPusherConfig();

const echo = new Echo({
  ...pusherConfig,
  auth: {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
    }
  }
});
```

#### 3. Uso no Composable
```typescript
// useChatManager.ts
const { $echo } = useNuxtApp();

$echo.channel(`chat.${chatId}`)
  .listen('MessageSent', (event) => {
    // Processar nova mensagem
  });
```

### Flutter (Mobile)

#### 1. Classe de Configuração
```dart
class PusherConfig {
  static const String appId = '1553073';
  static const String appKey = 'b395ac035994ca7af583';
  static const String appSecret = '8a20e39fc3f1ab6111af';
  static const String cluster = 'eu';
  static const String host = '';
  static const int port = 443;
  static const String scheme = 'https';
  
  // Configuração para o cliente Flutter
  static const String clientAppKey = appKey;
  static const String clientCluster = cluster;
  static const String? clientHost = null;
  static const int clientPort = port;
  static const String clientScheme = scheme;
}
```

#### 2. Implementação do Pusher
```dart
import 'package:pusher_channels_flutter/pusher_channels_flutter.dart';

class ChatService {
  late PusherChannelsFlutter pusher;
  
  Future<void> initializePusher() async {
    pusher = PusherChannelsFlutter.getInstance();
    
    await pusher.init(
      apiKey: PusherConfig.clientAppKey,
      cluster: PusherConfig.clientCluster,
      onEvent: onEvent,
      onSubscriptionSucceeded: onSubscriptionSucceeded,
      onSubscriptionError: onSubscriptionError,
    );
    
    await pusher.connect();
  }
  
  Future<void> subscribeToChat(int chatId) async {
    await pusher.subscribe(
      channelName: 'chat.$chatId',
      onEvent: onEvent,
    );
  }
  
  void onEvent(PusherEvent event) {
    if (event.eventName == 'MessageSent') {
      // Processar nova mensagem
      final message = jsonDecode(event.data);
      // Atualizar UI
    }
  }
}
```

## Estrutura de Eventos

### Evento MessageSent
```json
{
  "id": 104,
  "chat_id": 33,
  "content": "mas obra omi",
  "sender_type": "user",
  "sender_id": 2,
  "is_read": false,
  "created_at": "2025-08-13 19:52:48"
}
```

### Canais
- **Canal de Chat**: `chat.{chatId}` (ex: `chat.33`)
- **Evento**: `MessageSent`

## Configuração de Ambiente

### Variáveis de Ambiente (.env)
```bash
# Pusher Configuration
PUSHER_APP_KEY=b395ac035994ca7af583
PUSHER_APP_CLUSTER=eu
PUSHER_APP_ID=1553073
PUSHER_APP_SECRET=8a20e39fc3f1ab6111af
```

### Fallback Values
Se as variáveis de ambiente não estiverem definidas, o sistema usa os valores padrão configurados.

## Segurança

### Configurações de Segurança
- **forceTLS**: `true` - Força conexão TLS
- **encrypted**: `true` - Criptografa dados
- **scheme**: `https` - Usa HTTPS
- **port**: `443` - Porta padrão HTTPS

### Autenticação
- **Nuxt.js**: Token Bearer no header Authorization
- **Flutter**: Configuração via API key (sem autenticação para canais públicos)

## Testando a Conexão

### 1. Verificar Configuração
```typescript
// Console do navegador
console.log('Pusher Config:', window.Pusher);
console.log('Echo Config:', $echo);
```

### 2. Verificar Canais
```typescript
// Verificar se está escutando
$echo.channel('chat.33').subscribed(() => {
  console.log('✅ Conectado ao canal chat.33');
});
```

### 3. Verificar Eventos
```typescript
// Testar recebimento de eventos
$echo.channel('chat.33').listen('MessageSent', (event) => {
  console.log('🔔 Evento recebido:', event);
});
```

## Troubleshooting

### Problemas Comuns

#### 1. Conexão Falha
- Verificar credenciais do Pusher
- Verificar cluster correto
- Verificar se o host está acessível

#### 2. Eventos Não Recebidos
- Verificar nome do canal
- Verificar nome do evento
- Verificar se o backend está enviando

#### 3. Autenticação Falha
- Verificar token de autenticação
- Verificar headers corretos
- Verificar permissões do usuário

### Logs Úteis
- Console do navegador (Nuxt.js)
- Logs do Flutter
- Dashboard do Pusher
- Logs do Laravel (backend)

## Compatibilidade

### Versões Suportadas
- **Pusher-JS**: ^8.4.0
- **Laravel Echo**: Compatível com Laravel 8+
- **Flutter**: Pusher Channels Flutter

### Navegadores Suportados
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

### Plataformas Mobile
- iOS 11.0+
- Android 5.0+ (API 21+)
