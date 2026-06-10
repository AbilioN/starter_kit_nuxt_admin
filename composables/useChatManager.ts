import { ref, computed, readonly, watch, onUnmounted } from 'vue';
import { ChatService } from '~/services/ChatService';
import type { ChatMessage, Chat, ChatsResponse } from '~/types/chat';
import type { PusherMessageSentEvent, PusherTypingEvent } from '~/types/pusher';
import { PUSHER_EVENTS } from '~/config/pusher-events';

// Module-level guard: prevents duplicate personal channel subscriptions across
// multiple useChatManager() calls (e.g. ChatWidget + ChatInterface both mounted).
let _subscribedPersonalChannel: string | null = null;

export const useChatManager = () => {
  // Globally shared via useState so every component instance (ChatWidget badge,
  // ChatInterface list) always sees the same chat list and unread counts.
  const chats = useState<Chat[]>('chat_manager_chats', () => []);

  const currentChat = ref<Chat | null>(null);
  const messages = ref<ChatMessage[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref<any>(null);

  // userId → display name for current chat typing indicators
  const typingUsers = ref<Map<number, string>>(new Map());
  let currentTypingChatId: number | null = null;

  const currentUser = useAuth().user;
  const chatService = new ChatService();
  const notification = useNotification();

  // ── Personal channel (all MessageSent events across all chats) ──────────

  const subscribeToPersonalChannel = (channelName: string) => {
    const { $echo } = useNuxtApp() as any;
    if (!$echo || _subscribedPersonalChannel === channelName) return;

    _subscribedPersonalChannel = channelName;
    console.log('🔔 Subscribing to personal channel:', channelName);

    $echo.private(channelName)
      .listen(`.${PUSHER_EVENTS.MESSAGE_SENT}`, async (event: PusherMessageSentEvent) => {
        console.log('🔔 MessageSent on personal channel:', event);

        // Deduplicate: ignore if message already in the active view
        if (messages.value.some(m => m.id === event.id)) return;

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
          updated_at: createdAt,
        };

        // Append to active chat and scroll
        if (currentChat.value?.id === event.chat_id) {
          messages.value.push(newMessage);
          window.dispatchEvent(new CustomEvent('scroll-to-bottom'));
        }

        const chatIndex = chats.value.findIndex(c => c.id === event.chat_id);

        if (chatIndex !== -1) {
          const isActive = currentChat.value?.id === event.chat_id;

          // Reactive splice so Vue detects the mutation
          chats.value.splice(chatIndex, 1, {
            ...chats.value[chatIndex],
            last_message: newMessage,
            unread_count: isActive
              ? chats.value[chatIndex].unread_count
              : (chats.value[chatIndex].unread_count || 0) + 1,
          });

          // Notify about the incoming message in a non-active chat
          if (!isActive) {
            const chatName = chatService.getChatDisplayName(chats.value[chatIndex]);
            const senderLabel = event.sender_type === 'user' ? 'Usuário' : 'Admin';
            const preview = event.content.length > 60
              ? event.content.slice(0, 60) + '…'
              : event.content;
            notification.info(`${chatName} — ${senderLabel}: ${preview}`, 5000);
          }
        } else {
          // Unknown chat_id — a new conversation was created. Refresh the list
          // so the new chat appears without requiring a manual page reload.
          try {
            const response = await chatService.getChats(1);
            if (response.chats?.length) {
              const existingIds = new Set(chats.value.map(c => c.id));
              const incoming = response.chats.filter(c => !existingIds.has(c.id));
              if (incoming.length) {
                chats.value = [...incoming, ...chats.value];
                const newChat = incoming.find(c => c.id === event.chat_id);
                if (newChat) {
                  const chatName = chatService.getChatDisplayName(newChat);
                  const preview = event.content.length > 60
                    ? event.content.slice(0, 60) + '…'
                    : event.content;
                  notification.info(`Nova conversa — ${chatName}: ${preview}`, 6000);
                }
              }
            }
          } catch (err) {
            console.error('Failed to refresh chat list after unknown chat_id:', err);
          }
        }
      });
  };

  // ── Per-chat typing channel ─────────────────────────────────────────────

  const subscribeToTypingChannel = (chatId: number) => {
    const { $echo } = useNuxtApp() as any;
    if (!$echo || currentTypingChatId === chatId) return;

    console.log('🔔 Subscribing to typing channel for chat:', chatId);
    currentTypingChatId = chatId;
    typingUsers.value.clear();

    $echo.private(`chat.${chatId}`)
      .listenForWhisper('client-typing', (event: PusherTypingEvent) => {
        if (event.user_id !== currentUser.value?.id) {
          typingUsers.value.set(event.user_id, event.user_name);
        }
      })
      .listenForWhisper('client-stop-typing', (event: { user_id: number }) => {
        typingUsers.value.delete(event.user_id);
      });
  };

  const unsubscribeFromTypingChannel = (chatId: number) => {
    const { $echo } = useNuxtApp() as any;
    if (!$echo) return;
    console.log('🔔 Leaving typing channel for chat:', chatId);
    $echo.leave(`chat.${chatId}`);
    if (currentTypingChatId === chatId) {
      currentTypingChatId = null;
      typingUsers.value.clear();
    }
  };

  const sendTypingIndicator = (chatId: number) => {
    const { $echo } = useNuxtApp() as any;
    if (!$echo || !currentUser.value) return;
    $echo.private(`chat.${chatId}`).whisper('client-typing', {
      user_id: currentUser.value.id,
      user_name: currentUser.value.name,
      user_type: 'admin',
      chat_id: chatId,
    });
  };

  const sendStopTypingIndicator = (chatId: number) => {
    const { $echo } = useNuxtApp() as any;
    if (!$echo || !currentUser.value) return;
    $echo.private(`chat.${chatId}`).whisper('client-stop-typing', {
      user_id: currentUser.value.id,
      chat_id: chatId,
    });
  };

  // ── Subscribe to personal channel when user is authenticated ───────────

  watch(
    () => currentUser.value?.channel,
    (channel) => {
      if (channel) subscribeToPersonalChannel(channel);
    },
    { immediate: true },
  );

  // ── Chat operations ─────────────────────────────────────────────────────

  const loadChats = async (page: number = 1): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      const response: ChatsResponse = await chatService.getChats(page);
      chats.value = response.chats || [];
      pagination.value = response.pagination;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load chats';
      console.error('Load chats error:', err);
    } finally {
      loading.value = false;
    }
  };

  const startChatWithUser = async (userId: number, userType: 'user' | 'admin' = 'user') => {
    loading.value = true;
    error.value = null;
    try {
      const chat = await chatService.createPrivateChat(userId, userType);

      if (!chat?.id) throw new Error('Chat created without valid ID');

      const existingChat = chats.value.find(c => c.id === chat.id);
      if (!existingChat) chats.value.unshift(chat);

      currentChat.value = chat;

      if (currentTypingChatId !== null && currentTypingChatId !== chat.id) {
        unsubscribeFromTypingChannel(currentTypingChatId);
      }
      subscribeToTypingChannel(chat.id);

      return chat;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start chat';
      console.error('Start chat error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loadChatMessages = async (chatId: number, page: number = 1) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await chatService.getChatMessages(chatId, page);
      if (page === 1) {
        messages.value = response.messages;
      } else {
        messages.value.unshift(...response.messages);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load messages';
      console.error('Load chat messages error:', err);
    } finally {
      loading.value = false;
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentChat.value?.id || !content.trim()) return;
    try {
      sendStopTypingIndicator(currentChat.value.id);
      const message = await chatService.sendMessageToChat(currentChat.value.id, content);
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

  const sendMessageToUser = async (content: string, userId: number, userType: 'user' | 'admin' = 'user') => {
    try {
      const response = await chatService.sendMessageToUser(content, userId, userType);
      const existingChat = chats.value.find(c => c.id === response.chat.id);
      if (!existingChat) chats.value.unshift(response.chat);
      currentChat.value = response.chat;
      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send message';
      console.error('Send message to user error:', err);
      throw err;
    }
  };

  const selectChat = async (chat: Readonly<Chat>) => {
    const previousChatId = currentChat.value?.id;
    currentChat.value = { ...chat } as Chat;

    await loadChatMessages(chat.id);

    if (previousChatId !== undefined && previousChatId !== chat.id) {
      unsubscribeFromTypingChannel(previousChatId);
    }
    subscribeToTypingChannel(chat.id);
  };

  const testPusherConnection = () => {
    const { $echo } = useNuxtApp() as any;
    if (!$echo) {
      console.warn('Echo not available');
      notification.warning('Pusher não conectado');
      return;
    }
    const state = $echo.connector?.pusher?.connection?.state ?? 'unknown';
    console.log('✅ Pusher connection state:', state);
    notification.success(`Pusher: ${state}`);
  };

  const getChatDisplayName = (chat: Chat): string => chatService.getChatDisplayName(chat);
  const formatMessage = (message: ChatMessage) => chatService.formatMessage(message);
  const isOwnMessage = (message: ChatMessage): boolean => message.sender_id === currentUser.value?.id;

  const unreadChats = computed(() => chats.value.filter(chat => chat.unread_count > 0));
  const totalUnread = computed(() =>
    chats.value.reduce((total, chat) => total + (chat.unread_count || 0), 0),
  );
  const formattedMessages = computed(() => messages.value.map(message => formatMessage(message)));
  const typingUserNames = computed(() => Array.from(typingUsers.value.values()));

  onUnmounted(() => {
    const { $echo } = useNuxtApp() as any;
    if ($echo && currentTypingChatId !== null) {
      $echo.leave(`chat.${currentTypingChatId}`);
    }
  });

  return {
    chats: readonly(chats) as ComputedRef<Chat[]>,
    currentChat: readonly(currentChat),
    messages: readonly(messages),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    typingUserNames,

    unreadChats,
    totalUnread,
    formattedMessages,
    currentUser,

    loadChats,
    startChatWithUser,
    loadChatMessages,
    sendMessage,
    sendMessageToUser,
    selectChat,
    getChatDisplayName,
    formatMessage,
    isOwnMessage,
    sendTypingIndicator,
    sendStopTypingIndicator,
    subscribeToPersonalChannel,
    testPusherConnection,
  };
};
