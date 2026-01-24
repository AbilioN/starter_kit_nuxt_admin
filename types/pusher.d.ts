/**
 * Tipos para eventos do Pusher
 */

export interface PusherMessageSentEvent {
  id: number;
  chat_id: number;
  content: string;
  sender_type: 'user' | 'admin';
  sender_id: number;
  is_read: boolean;
  created_at: string;
}

export interface PusherMessageReadEvent {
  message_id: number;
  chat_id: number;
  read_at: string;
  read_by: number;
}

export interface PusherChatEvent {
  chat_id: number;
  chat: {
    id: number;
    name: string;
    type: 'private' | 'group';
    description: string;
    created_at: string;
    updated_at: string;
  };
}

export interface PusherUserEvent {
  user_id: number;
  user_type: 'user' | 'admin';
  timestamp: string;
}

export interface PusherTypingEvent {
  user_id: number;
  user_type: 'user' | 'admin';
  chat_id: number;
  is_typing: boolean;
}
