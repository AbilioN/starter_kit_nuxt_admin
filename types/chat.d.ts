// Tipos para o sistema de chat
export interface ChatMessage {
  id: number;
  chat_id: number;
  content: string;
  sender_id: number;
  sender_type: 'user' | 'admin';
  message_type: 'text' | 'image' | 'file' | 'audio' | 'video';
  metadata: any | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ChatUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  is_online: boolean;
  last_seen?: string;
}

export interface Chat {
  id: number;
  type: 'private' | 'group';
  name: string | null;
  description: string | null;
  last_message?: ChatMessage;
  unread_count: number;
  participants_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ChatChannel {
  id: number;
  name: string | null;
  type: 'public' | 'private' | 'direct';
  participants: ChatUser[];
  last_message?: ChatMessage;
  unread_count: number;
}

export interface ChatEvent {
  message: ChatMessage;
  channel_id: number;
  user: ChatUser;
}

export interface TypingEvent {
  user_id: number;
  user_name: string;
  channel_id: number;
  is_typing: boolean;
}

// Tipos para respostas da API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ChatResponse extends Chat {
  participants_count: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  created_by_type: 'user' | 'admin';
}

// Wrapper da API para criação de chat
export interface ChatCreateResponse {
  success: boolean;
  data: ChatResponse;
}

// Wrapper da API para envio de mensagem
export interface MessageSendResponse {
  success: boolean;
  data: MessageResponse;
}

// Wrapper da API para envio de mensagem para usuário
export interface ChatMessageSendResponse {
  success: boolean;
  data: ChatMessageResponse;
}

// Wrapper da API para buscar mensagens
export interface MessagesFetchResponse {
  success: boolean;
  data: MessagesResponse;
}

// Wrapper da API para buscar chats
export interface ChatsFetchResponse {
  success: boolean;
  data: ChatsResponse;
}

export interface MessageResponse extends ChatMessage {}

export interface ChatMessageResponse {
  chat: ChatResponse;
  message: MessageResponse;
}

export interface ChatsResponse {
  chats: Chat[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface MessagesResponse {
  messages: ChatMessage[];
  from_cache: boolean;
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
} 