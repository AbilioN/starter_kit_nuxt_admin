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
  // Canais para mensagens de chat
  CHAT: (chatId: number) => `chat.${chatId}`,
  
  // Canais privados (para futuras funcionalidades)
  PRIVATE_USER: (userId: number) => `private-user.${userId}`,
  PRIVATE_CHAT: (chatId: number) => `private-chat.${chatId}`,
  
  // Canais públicos (para futuras funcionalidades)
  PUBLIC_CHAT: (chatId: number) => `public-chat.${chatId}`,
  PUBLIC_USERS: 'public-users'
} as const;

export type PusherEventType = typeof PUSHER_EVENTS[keyof typeof PUSHER_EVENTS];
export type PusherChannelType = string | ((...args: any[]) => string);
