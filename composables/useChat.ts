import type { ChatMessage, ChatUser, Chat, ChatEvent, TypingEvent } from '~/types/chat';
import { ChatService } from '~/services/ChatService';

export const useChat = () => {
  // Estados reativos
  const messages = ref<ChatMessage[]>([]);
  const channels = ref<Chat[]>([]);
  const currentChannel = ref<Chat | null>(null);
  const onlineUsers = ref<ChatUser[]>([]);
  const typingUsers = ref<Set<number>>(new Set());
  const isConnected = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Dados do usuário atual
  const { user } = useAuth();
  const currentUser = computed(() => user.value);

  // Instância do Echo
  const { $echo } = useNuxtApp();

  // Instância do serviço
  const chatService = new ChatService();

  // Função para conectar ao chat
  const connectToChat = () => {
    if (!$echo || !currentUser.value) return;

    try {
      // Conectar ao canal público
      const channel = $echo.channel('chat');
      
      // Escutar mensagens
      channel.listen('MessageSent', (event: ChatEvent) => {
        if (event.channel_id === currentChannel.value?.id) {
          messages.value.push(event.message);
          scrollToBottom();
        }
      });

      // Escutar usuários digitando
      channel.listen('UserTyping', (event: TypingEvent) => {
        if (event.channel_id === currentChannel.value?.id) {
          if (event.is_typing) {
            typingUsers.value.add(event.user_id);
          } else {
            typingUsers.value.delete(event.user_id);
          }
        }
      });

      // Escutar usuários online
      channel.listen('UserOnline', (event: { user: ChatUser }) => {
        const existingUser = onlineUsers.value.find(u => u.id === event.user.id);
        if (!existingUser) {
          onlineUsers.value.push(event.user);
        } else {
          existingUser.is_online = true;
          existingUser.last_seen = undefined;
        }
      });

      // Escutar usuários offline
      channel.listen('UserOffline', (event: { user_id: number }) => {
        const user = onlineUsers.value.find(u => u.id === event.user_id);
        if (user) {
          user.is_online = false;
          user.last_seen = new Date().toISOString();
        }
      });

      isConnected.value = true;
    } catch (err) {
      error.value = 'Erro ao conectar ao chat';
      console.error('Chat connection error:', err);
    }
  };

  // Função para desconectar do chat
  const disconnectFromChat = () => {
    if ($echo) {
      $echo.leaveChannel('chat');
      isConnected.value = false;
    }
  };

  // Função para enviar mensagem
  const sendMessage = async (message: string) => {
    if (!$echo || !currentUser.value || !message.trim()) return;

    try {
      // Usar o serviço para enviar mensagem
      const newMessage = await chatService.sendMessageToChat(
        currentChannel.value?.id || 1,
        message
      );

      // Adicionar mensagem localmente
      messages.value.push(newMessage);
      scrollToBottom();

      // Emitir evento de mensagem enviada
      $echo.channel('chat').whisper('MessageSent', {
        message: newMessage,
        channel_id: currentChannel.value?.id || 1,
        user: currentUser.value
      });

      // Parar de digitar
      stopTyping();

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
      console.error('Send message error:', err);
    }
  };

  // Função para indicar que está digitando
  const startTyping = () => {
    if (!$echo || !currentUser.value) return;

    $echo.channel('chat').whisper('UserTyping', {
      user_id: currentUser.value.id,
      user_name: currentUser.value.name,
      channel_id: currentChannel.value?.id || 1,
      is_typing: true
    });
  };

  // Função para parar de digitar
  const stopTyping = () => {
    if (!$echo || !currentUser.value) return;

    $echo.channel('chat').whisper('UserTyping', {
      user_id: currentUser.value.id,
      user_name: currentUser.value.name,
      channel_id: currentChannel.value?.id || 1,
      is_typing: false
    });
  };

  // Função para carregar mensagens
  const loadMessages = async (channelId: number) => {
    loading.value = true;
    error.value = null;

    try {
      // Usar o serviço para carregar mensagens
      const response = await chatService.getChatMessages(channelId);
      messages.value = response.messages;
      scrollToBottom();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erro ao carregar mensagens';
      console.error('Load messages error:', err);
    } finally {
      loading.value = false;
    }
  };

  // Função para carregar canais
  const loadChannels = async () => {
    try {
      // Usar o serviço para carregar canais
      const response = await chatService.getChats();
      channels.value = response.chats;
      
      // Definir canal padrão
      if (!currentChannel.value && response.chats.length > 0) {
        currentChannel.value = response.chats[0];
        await loadMessages(response.chats[0].id);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erro ao carregar canais';
      console.error('Load channels error:', err);
    }
  };

  // Função para trocar de canal
  const switchChannel = async (channel: Readonly<Chat>) => {
    currentChannel.value = { ...channel };
    await loadMessages(channel.id);
    
    // Marcar mensagens como lidas
    try {
      // Implementar quando a API estiver disponível
      // await chatService.markAsRead(channel.id);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Função para rolar para o final da conversa
  const scrollToBottom = () => {
    nextTick(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    });
  };

  // Computed para texto de digitação
  const typingText = computed(() => {
    if (typingUsers.value.size === 0) return '';
    
    const typingUserNames = Array.from(typingUsers.value).map(userId => {
      const user = onlineUsers.value.find(u => u.id === userId);
      return user ? user.name : 'Alguém';
    });
    
    if (typingUserNames.length === 1) {
      return `${typingUserNames[0]} está digitando...`;
    } else if (typingUserNames.length === 2) {
      return `${typingUserNames[0]} e ${typingUserNames[1]} estão digitando...`;
    } else {
      return 'Várias pessoas estão digitando...';
    }
  });

  // Computed para mensagens formatadas
  const formattedMessages = computed(() => {
    return messages.value.map(message => ({
      ...message,
      time: new Date(message.created_at).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isOwn: message.user_id === currentUser.value?.id
    }));
  });

  return {
    // Estados
    messages: readonly(messages),
    channels: readonly(channels),
    currentChannel: readonly(currentChannel),
    onlineUsers: readonly(onlineUsers),
    isConnected: readonly(isConnected),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    typingText,
    formattedMessages,
    
    // Funções
    connectToChat,
    disconnectFromChat,
    sendMessage,
    startTyping,
    stopTyping,
    loadMessages,
    loadChannels,
    switchChannel,
    scrollToBottom
  };
}; 