/**
 * Configuração dos eventos do Pusher para o sistema de chat
 */

export const PUSHER_EVENTS = {
  // Eventos de mensagem
  MESSAGE_SENT: 'MessageSent',
  MESSAGE_READ: 'MessageRead',
  MESSAGE_DELETED: 'MessageDeleted',
  
  // Eventos de chat
  CHAT_CREATED: 'ChatCreated',
  CHAT_UPDATED: 'ChatUpdated',
  CHAT_DELETED: 'ChatDeleted',
  
  // Eventos de usuário
  USER_ONLINE: 'UserOnline',
  USER_OFFLINE: 'UserOffline',
  USER_TYPING: 'UserTyping',
  USER_STOPPED_TYPING: 'UserStoppedTyping'
} as const;

export const PUSHER_CHANNELS = {
  // Personal channels — one per user, receives ALL MessageSent events across all their chats
  // Pass to Echo.private() — Echo prepends "private-" automatically
  PERSONAL_ADMIN: (adminId: string) => `user.admin.${adminId}`,
  PERSONAL_USER: (userId: string) => `user.user.${userId}`,

  // Per-chat channel — used for typing indicators only
  // Pass to Echo.private() — Echo prepends "private-" automatically
  CHAT: (chatId: string) => `chat.${chatId}`,
} as const;

export type PusherEventType = typeof PUSHER_EVENTS[keyof typeof PUSHER_EVENTS];
export type PusherChannelType = string | ((...args: any[]) => string);
