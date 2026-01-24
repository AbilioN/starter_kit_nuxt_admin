# Configuração do Chat em Tempo Real

## ✅ Configuração Atual

O chat já está configurado com as seguintes credenciais do Pusher:

```env
PUSHER_APP_KEY=b395ac035994ca7af583
PUSHER_APP_CLUSTER=eu
PUSHER_APP_ID=1553073
PUSHER_APP_SECRET=8a20e39fc3f1ab6111af
```

## 🚀 Como Testar

1. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Faça login** na aplicação

3. **Clique no botão de chat** no canto inferior direito

4. **Teste o chat** enviando mensagens

## 🔧 Configuração do Backend Laravel

Certifique-se de que seu backend Laravel tenha:

### 1. Configuração do Broadcasting
No arquivo `config/broadcasting.php`:
```php
'pusher' => [
    'driver' => 'pusher',
    'key' => env('PUSHER_APP_KEY', 'b395ac035994ca7af583'),
    'secret' => env('PUSHER_APP_SECRET', '8a20e39fc3f1ab6111af'),
    'app_id' => env('PUSHER_APP_ID', '1553073'),
    'options' => [
        'cluster' => env('PUSHER_APP_CLUSTER', 'eu'),
        'encrypted' => true,
        'host' => env('PUSHER_HOST') ?: 'api-'.env('PUSHER_APP_CLUSTER', 'eu').'.pusherapp.com',
        'port' => env('PUSHER_PORT', 443),
        'scheme' => env('PUSHER_SCHEME', 'https')
    ],
],
```

### 2. Eventos de Broadcast
Crie os eventos necessários:

```php
// app/Events/MessageSent.php
<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    public $channelId;
    public $user;

    public function __construct($message, $channelId, $user)
    {
        $this->message = $message;
        $this->channelId = $channelId;
        $this->user = $user;
    }

    public function broadcastOn()
    {
        return new Channel('chat');
    }

    public function broadcastAs()
    {
        return 'MessageSent';
    }
}
```

```php
// app/Events/UserTyping.php
<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserTyping implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $userName;
    public $channelId;
    public $isTyping;

    public function __construct($userId, $userName, $channelId, $isTyping)
    {
        $this->userId = $userId;
        $this->userName = $userName;
        $this->channelId = $channelId;
        $this->isTyping = $isTyping;
    }

    public function broadcastOn()
    {
        return new Channel('chat');
    }

    public function broadcastAs()
    {
        return 'UserTyping';
    }
}
```

### 3. Rotas de API
```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/chat/channels', [ChatController::class, 'channels']);
    Route::get('/chat/messages/{channel}', [ChatController::class, 'messages']);
    Route::post('/chat/messages', [ChatController::class, 'store']);
    Route::post('/chat/channels/{channel}/read', [ChatController::class, 'markAsRead']);
    Route::get('/chat/users/online', [ChatController::class, 'onlineUsers']);
});
```

### 4. Controller de Exemplo
```php
// app/Http/Controllers/ChatController.php
<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\ChatMessage;
use App\Models\ChatChannel;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function channels()
    {
        return response()->json([
            'data' => ChatChannel::all()
        ]);
    }

    public function messages($channelId)
    {
        $messages = ChatMessage::where('channel_id', $channelId)
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'data' => $messages
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'channel_id' => 'required|integer',
            'message' => 'required|string|max:1000'
        ]);

        $message = ChatMessage::create([
            'channel_id' => $request->channel_id,
            'user_id' => auth()->id(),
            'message' => $request->message
        ]);

        // Broadcast do evento
        broadcast(new MessageSent($message, $request->channel_id, auth()->user()))->toOthers();

        return response()->json([
            'data' => $message->load('user')
        ]);
    }

    public function markAsRead($channelId)
    {
        // Marcar mensagens como lidas
        ChatMessage::where('channel_id', $channelId)
            ->where('user_id', '!=', auth()->id())
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function onlineUsers()
    {
        // Retornar usuários online
        return response()->json([
            'data' => User::where('last_seen_at', '>', now()->subMinutes(5))->get()
        ]);
    }
}
```

## 🎯 Funcionalidades Implementadas

- ✅ **Chat em tempo real** com Pusher
- ✅ **Indicador de digitação**
- ✅ **Lista de canais**
- ✅ **Mensagens com timestamp**
- ✅ **Interface responsiva**
- ✅ **Indicador de conexão**
- ✅ **Scroll automático**
- ✅ **Badges de mensagens não lidas**
- ✅ **Validação de mensagens**

## 🔍 Troubleshooting

### Erro de conexão
- Verifique se o backend Laravel está rodando
- Confirme se as credenciais do Pusher estão corretas
- Verifique os logs do console do navegador

### Mensagens não aparecem
- Verifique se o evento está sendo emitido no backend
- Confirme se o canal 'chat' está correto
- Verifique se o usuário está autenticado

### Problemas de autenticação
- Certifique-se de que o token está sendo enviado
- Verifique se o middleware de autenticação está configurado 