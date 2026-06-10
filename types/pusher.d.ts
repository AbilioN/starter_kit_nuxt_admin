/**
 * Tipos para eventos do Pusher
 */

export interface PusherMessageSentEvent {
  id: string;
  chat_id: string;
  content: string;
  sender_type: 'user' | 'admin';
  sender_id: string;
  is_read: boolean;
  created_at: string;
}

export interface PusherMessageReadEvent {
  chat_id: string;
  reader_id: string;
  reader_type: string;
  read_at: string;
}

export interface PusherMessageEditedEvent {
  id: string;
  chat_id: string;
  content: string;
  edited_at: string;
}

export interface PusherMessageDeletedEvent {
  id: string;
  chat_id: string;
}

export interface PusherChatEvent {
  chat_id: string;
  chat: {
    id: string;
    name: string;
    type: 'private' | 'group';
    description: string;
    created_at: string;
    updated_at: string;
  };
}

export interface PusherUserEvent {
  user_id: string;
  user_type: 'user' | 'admin';
  timestamp: string;
}

export interface PusherTypingEvent {
  user_id: string;
  user_name: string;
  user_type: 'user' | 'admin';
  chat_id: string;
}
