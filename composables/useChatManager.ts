import { ref, computed, readonly, onMounted, onUnmounted } from 'vue';
import { ChatService } from '~/services/ChatService';
import type { ChatMessage, Chat, ChatsResponse } from '~/types/chat';
import type { PusherMessageSentEvent, PusherMessageReadEvent } from '~/types/pusher';
import { PUSHER_EVENTS, PUSHER_CHANNELS } from '~/config/pusher-events';

export const useChatManager = () => {
  // Estados reativos
  const chats = ref<Chat[]>([]);
  const currentChat = ref<Chat | null>(null);
  const messages = ref<ChatMessage[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref<any>(null);

  // Tracks channels that already have a MESSAGE_SENT handler bound.
  // Pusher.bind() stacks handlers — calling it twice on the same channel
  // causes every incoming event to fire twice.
  const boundChannels = new Set<string>();

  // Usuário atual
  const currentUser = useAuth().user;

  // Instância do serviço
  const chatService = new ChatService();

  /**
   * Carregar chats
   */
  const loadChats = async (page: number = 1): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const response: ChatsResponse = await chatService.getChats(page);
      console.log(response);
      chats.value = response.chats || [];
      pagination.value = response.pagination;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load chats';
      console.error('Load chats error:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Iniciar chat com usuário
   */
  const startChatWithUser = async (userId: number, userType: 'user' | 'admin' = 'user') => {
    loading.value = true;
    error.value = null;

    try {
      const chat = await chatService.createPrivateChat(userId, userType);
      console.log('🚀 Chat criado:', chat);
      
      // Verificar se o chat tem ID
      if (!chat || !chat.id) {
        throw new Error('Chat created without valid ID');
      }
      
      // Adicionar à lista de chats se não existir
      const existingChat = chats.value.find(c => c.id === chat.id);
      if (!existingChat) {
        chats.value.unshift(chat);
      }

      // Definir como chat atual
      currentChat.value = chat;
      console.log('🎯 CurrentChat definido:', currentChat.value);

      // Configurar listener do Pusher para o novo chat
      await setupPusherListenerForChat(chat.id);

      // Retornar o chat criado
      return chat;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start chat';
      console.error('Start chat error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Carregar mensagens de um chat
   */
  const loadChatMessages = async (chatId: number, page: number = 1) => {
    console.log('📥 loadChatMessages chamado para chat ID:', chatId);
    loading.value = true;
    error.value = null;

    try {
      const response = await chatService.getChatMessages(chatId, page);
      console.log('📥 Resposta do getChatMessages:', response);
      console.log('📥 Messages array:', response.messages);
      console.log('📥 Messages length:', response.messages?.length);
      
      if (page === 1) {
        messages.value = response.messages;
        console.log('📥 Messages definidos:', messages.value);
      } else {
        // Para paginação, adicionar mensagens no início
        messages.value.unshift(...response.messages);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load messages';
      console.error('Load chat messages error:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Enviar mensagem para chat atual
   */
  const sendMessage = async (content: string) => {
    console.log('📤 Tentando enviar mensagem:', { currentChat: currentChat.value, content });
    
    if (!currentChat.value || !currentChat.value.id || !content.trim()) {
      console.error('Send message error: currentChat or chat ID is undefined', currentChat.value);
      return;
    }

    try {
      console.log('📤 Enviando mensagem para chat ID:', currentChat.value.id);
      const message = await chatService.sendMessageToChat(currentChat.value.id, content);
      
      // NÃO adicionar mensagem à lista localmente
      // Deixar o Pusher fazer a inserção para evitar problemas de formatação
      // messages.value.push(message);
      
      // Atualizar última mensagem na conversa
      if (currentChat.value) {
        currentChat.value.last_message = message;
        currentChat.value.unread_count = 0;
      }

      return message;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send message';
      console.error('Send message error:', err);
      throw err;
    }
  };

  /**
   * Enviar mensagem para usuário específico
   */
  const sendMessageToUser = async (content: string, userId: number, userType: 'user' | 'admin' = 'user') => {
    try {
      const response = await chatService.sendMessageToUser(content, userId, userType);
      
      // Adicionar chat à lista se não existir
      const existingChat = chats.value.find(c => c.id === response.chat.id);
      if (!existingChat) {
        chats.value.unshift(response.chat);
      }

      // Definir como chat atual
      currentChat.value = response.chat;

      // NÃO adicionar mensagem à lista localmente
      // Deixar o Pusher fazer a inserção para evitar problemas de formatação
      // messages.value.push(response.message);

      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send message';
      console.error('Send message to user error:', err);
      throw err;
    }
  };

  /**
   * Selecionar chat
   */
  const selectChat = async (chat: Readonly<Chat>) => {
    console.log('🎯 selectChat chamado com:', chat);
    console.log('🎯 Chat ID:', chat.id);
    
    currentChat.value = { 
      ...chat
    } as Chat;
    
    console.log('🎯 CurrentChat definido:', currentChat.value);
    
    // Carregar mensagens do chat
    await loadChatMessages(chat.id);
    
    // Configurar listener do Pusher para o chat selecionado se ainda não estiver configurado
    await setupPusherListenerForChat(chat.id);
  };

  /**
   * Formatar nome do chat para exibição
   */
  const getChatDisplayName = (chat: Chat): string => {
    return chatService.getChatDisplayName(chat);
  };

  /**
   * Formatar mensagem para exibição
   */
  const formatMessage = (message: ChatMessage) => {
    return chatService.formatMessage(message);
  };

  /**
   * Verificar se mensagem é própria
   */
  const isOwnMessage = (message: ChatMessage): boolean => {
    return message.sender_id === currentUser.value?.id;
  };

  /**
   * Obter chats não lidos
   */
  const unreadChats = computed(() => {
    return chats.value.filter(chat => chat.unread_count > 0);
  });

  /**
   * Total de mensagens não lidas
   */
  const totalUnread = computed(() => {
    return chats.value.reduce((total, chat) => total + chat.unread_count, 0);
  });

  /**
   * Mensagens formatadas
   */
  const formattedMessages = computed(() => {
    console.log('🎨 formattedMessages computed chamada');
    console.log('🎨 messages.value:', messages.value);
    console.log('🎨 messages.value.length:', messages.value.length);
    
    const formatted = messages.value.map(message => formatMessage(message));
    console.log('🎨 formatted result:', formatted);
    
    return formatted;
  });

  /**
   * Configurar listener do Pusher para novas mensagens
   */
  const setupPusherListener = () => {
    try {
      console.log('🔔 setupPusherListener iniciado');
      
      // Obter instância do Pusher do plugin
      const { $pusher } = useNuxtApp();
      console.log('🔔 Pusher obtido:', $pusher);
      
      if (!$pusher) {
        console.warn('⚠️ Pusher não disponível para listener');
        return;
      }

      console.log('🔔 Configurando listener do Pusher para novas mensagens...');

      // Escutar canais de chat para mensagens
      const currentUser = useAuth().user.value;
      console.log('🔔 Usuário atual:', currentUser);
      
      if (currentUser?.id) {
        console.log('🔔 Chats disponíveis para configurar listener:', chats.value);
        
        // Escutar todos os chats do usuário
        chats.value.forEach(chat => {
          const channelName = PUSHER_CHANNELS.CHAT(chat.id);
          console.log('🔔 Configurando listener para canal:', channelName);

          try {
            if (boundChannels.has(channelName)) {
              console.log(`🔔 Handler já registrado para ${channelName}, pulando...`);
              return;
            }

            const channel = $pusher.subscribe(channelName);
            console.log('🔔 Canal inscrito:', channel);

            channel.bind(PUSHER_EVENTS.MESSAGE_SENT, (event: PusherMessageSentEvent) => {
              console.log('🔔 Nova mensagem recebida via Pusher:', event);

              // Guard against duplicates — same ID can arrive from both
              // setupPusherListener and setupPusherListenerForChat if called in sequence.
              if (messages.value.some(m => m.id === event.id)) {
                console.log('🔔 Mensagem duplicada ignorada (id:', event.id, ')');
                return;
              }

              let createdAt = event.created_at;
              try {
                if (createdAt && isNaN(new Date(createdAt).getTime())) {
                  createdAt = new Date().toISOString();
                }
              } catch {
                createdAt = new Date().toISOString();
              }

              const newMessage: ChatMessage = {
                id: event.id,
                chat_id: event.chat_id,
                content: event.content,
                sender_id: event.sender_id,
                sender_type: event.sender_type,
                message_type: 'text',
                metadata: null,
                is_read: event.is_read,
                read_at: null,
                created_at: createdAt,
                updated_at: createdAt
              };

              messages.value.push(newMessage);
              console.log('🔔 Mensagem adicionada ao estado:', newMessage);

              const chatIndex = chats.value.findIndex(c => c.id === event.chat_id);
              if (chatIndex !== -1) {
                chats.value[chatIndex].last_message = newMessage;
                chats.value[chatIndex].unread_count = (chats.value[chatIndex].unread_count || 0) + 1;
              }

              if (currentChat.value?.id === event.chat_id) {
                window.dispatchEvent(new CustomEvent('scroll-to-bottom'));
              }
            });

            boundChannels.add(channelName);
            console.log(`✅ Listener configurado para chat ${chat.id} no canal ${channelName}`);
          } catch (channelError) {
            console.error(`❌ Erro ao configurar listener para chat ${chat.id}:`, channelError);
          }
        });
      } else {
        console.warn('⚠️ Usuário não autenticado, não é possível configurar listener');
      }

      // TODO: Implementar listener para mensagens lidas quando necessário
      // .listen(PUSHER_EVENTS.MESSAGE_READ, (event: PusherMessageReadEvent) => { ... });

      console.log('✅ Listener do Pusher configurado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao configurar listener do Pusher:', error);
    }
  };

  /**
   * Configurar listener do Pusher para um chat específico
   */
  const setupPusherListenerForChat = async (chatId: number) => {
    try {
      console.log(`🔔 setupPusherListenerForChat iniciado para chat ID: ${chatId}`);
      const { $pusher } = useNuxtApp();

      if (!$pusher) {
        console.warn('⚠️ Pusher não disponível para listener de chat específico');
        return;
      }

      const channelName = PUSHER_CHANNELS.CHAT(chatId);
      console.log('🔔 Configurando listener para canal:', channelName);

      if (boundChannels.has(channelName)) {
        console.log(`🔔 Handler já registrado para ${channelName}, pulando...`);
        return;
      }

      const channel = $pusher.subscribe(channelName);
      console.log('🔔 Canal inscrito:', channel);

      channel.bind(PUSHER_EVENTS.MESSAGE_SENT, (event: PusherMessageSentEvent) => {
        console.log('🔔 Nova mensagem recebida via Pusher para chat:', chatId, event);

        if (messages.value.some(m => m.id === event.id)) {
          console.log('🔔 Mensagem duplicada ignorada (id:', event.id, ')');
          return;
        }

        let createdAt = event.created_at;
        try {
          if (createdAt && isNaN(new Date(createdAt).getTime())) {
            createdAt = new Date().toISOString();
          }
        } catch {
          createdAt = new Date().toISOString();
        }

        const newMessage: ChatMessage = {
          id: event.id,
          chat_id: event.chat_id,
          content: event.content,
          sender_id: event.sender_id,
          sender_type: event.sender_type,
          message_type: 'text',
          metadata: null,
          is_read: event.is_read,
          read_at: null,
          created_at: createdAt,
          updated_at: createdAt
        };

        messages.value.push(newMessage);
        console.log('🔔 Mensagem adicionada ao estado para chat:', chatId, newMessage);

        const chatIndex = chats.value.findIndex(c => c.id === event.chat_id);
        if (chatIndex !== -1) {
          chats.value[chatIndex].last_message = newMessage;
          chats.value[chatIndex].unread_count = (chats.value[chatIndex].unread_count || 0) + 1;
        }

        if (currentChat.value?.id === event.chat_id) {
          window.dispatchEvent(new CustomEvent('scroll-to-bottom'));
        }
      });

      boundChannels.add(channelName);
      console.log(`✅ Listener do Pusher configurado com sucesso para chat ${chatId}`);
    } catch (error) {
      console.error(`❌ Erro ao configurar listener do Pusher para chat ${chatId}:`, error);
    }
  };

  /**
   * Testar conexão do Pusher
   */
  const testPusherConnection = () => {
    try {
      console.log('🧪 Testando conexão do Pusher...');
      
      const { $pusher } = useNuxtApp();
      if (!$pusher) {
        console.error('❌ Pusher não disponível para teste');
        return;
      }

      // Testar conexão com um canal público
      const testChannel = $pusher.subscribe('test-channel');
      
      testChannel.bind('pusher:subscription_succeeded', () => {
        console.log('✅ Conectado ao canal de teste');
        console.log('✅ Connection ID:', $pusher.connection.connection.id);
      });

      testChannel.bind('pusher:subscription_error', (status: any) => {
        console.error('❌ Erro na inscrição:', status);
      });

      console.log('🧪 Teste de conexão iniciado');
    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error);
    }
  };

  /**
   * Limpar listener do Pusher
   */
  const cleanupPusherListener = () => {
    try {
      const { $pusher } = useNuxtApp();
      
      if ($pusher) {
        console.log('🔔 Limpando listener do Pusher...');
        // O Pusher automaticamente limpa os listeners quando desconecta
        $pusher.disconnect();
      }
    } catch (error) {
      console.error('❌ Erro ao limpar listener do Pusher:', error);
    }
  };

  // Configurar listener do Pusher quando o composable é montado
  onMounted(() => {
    console.log('🚀 useChatManager - onMounted chamado');
    console.log('🚀 Chats disponíveis:', chats.value);
    console.log('🚀 Usuário atual:', currentUser.value);
    
    // Aguardar um pouco para garantir que os chats foram carregados
    setTimeout(() => {
      console.log('🚀 Executando setupPusherListener após delay');
      setupPusherListener();
    }, 1000);
  });

  // Limpar listener quando o composable é desmontado
  onUnmounted(() => {
    cleanupPusherListener();
  });

  return {
    // Estados
    chats: readonly(chats) as ComputedRef<Chat[]>,
    currentChat: readonly(currentChat),
    messages: readonly(messages),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),

    // Computed
    unreadChats,
    totalUnread,
    formattedMessages,
    currentUser,

    // Funções
    loadChats,
    startChatWithUser,
    loadChatMessages,
    sendMessage,
    sendMessageToUser,
    selectChat,
    getChatDisplayName,
    formatMessage,
    isOwnMessage,
    testPusherConnection,
    setupPusherListenerForChat
  };
}; 