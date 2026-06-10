import { ApiClient } from '~/infrastructure/http/ApiClient';
import type { 
  ChatMessage, 
  Chat, 
  ChatChannel,
  ApiResponse, 
  ChatResponse, 
  ChatCreateResponse,
  MessageResponse, 
  MessageSendResponse,
  ChatMessageResponse,
  ChatMessageSendResponse,
  ChatsResponse,
  ChatsFetchResponse,
  MessagesResponse,
  MessagesFetchResponse
} from '~/types/chat';

export class ChatRepository {
  private apiClient: ApiClient;
  private chatApiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
    // Cliente específico para chat sem /admin
    this.chatApiClient = new ApiClient('http://localhost:8006/api');
  }

  /**
   * Enviar mensagem para outro usuário (cria/usa chat privado)
   */
  async sendMessageToUser(content: string, receiverId: number, receiverType: 'user' | 'admin'): Promise<ChatMessageSendResponse> {
    try {
      const response = await this.chatApiClient.post<ChatMessageSendResponse>('/chat/send', {
        content,
        receiver_type: receiverType,
        receiver_id: receiverId,
        message_type: 'text'
      });
      return response;
    } catch (error) {
      console.error('ChatRepository - sendMessageToUser error:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Buscar conversa entre dois usuários
   */
  async getConversation(otherUserId: number, otherUserType: 'user' | 'admin', page: number = 1, perPage: number = 50): Promise<any> {
    try {
      const response = await this.chatApiClient.get<any>(`/chat/conversation?other_user_type=${otherUserType}&other_user_id=${otherUserId}&page=${page}&per_page=${perPage}`);
      console.log('🔍 ChatRepository - getConversation raw response:', response);
      return response;
    } catch (error) {
      console.error('ChatRepository - getConversation error:', error);
      throw new Error('Failed to fetch conversation');
    }
  }

  /**
   * Listar todos os chats do usuário
   */
  async getChats(page: number = 1, perPage: number = 20): Promise<any> {
    try {
      const response = await this.chatApiClient.get<any>(`/chats?page=${page}&per_page=${perPage}`);
      console.log('🔍 ChatRepository - getChats raw response:', response);
      return response;
    } catch (error) {
      console.error('ChatRepository - getChats error:', error);
      throw new Error('Failed to fetch chats');
    }
  }

  /**
   * Buscar mensagens de um chat específico
   */
  async getChatMessages(chatId: string | number, page: number = 1, perPage: number = 50): Promise<any> {
    try {
      const response = await this.chatApiClient.get<any>(`/chat/${chatId}/messages?page=${page}&per_page=${perPage}`);
      console.log('🔍 ChatRepository - getChatMessages raw response:', response);
      return response;
    } catch (error) {
      console.error('ChatRepository - getChatMessages error:', error);
      throw new Error('Failed to fetch chat messages');
    }
  }

  /**
   * Enviar mensagem para um chat específico
   */
  async sendMessageToChat(chatId: string | number, content: string): Promise<MessageSendResponse> {
    try {
      const response = await this.chatApiClient.post<MessageSendResponse>(`/chat/${chatId}/send`, {
        content,
        message_type: 'text'
      });
      return response;
    } catch (error) {
      console.error('ChatRepository - sendMessageToChat error:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Criar chat privado
   */
  async createPrivateChat(otherUserId: string | number, otherUserType: 'user' | 'admin'): Promise<ChatCreateResponse> {
    try {
      const response = await this.chatApiClient.post<ChatCreateResponse>('/chat/create-private', {
        other_user_id: otherUserId,
        other_user_type: otherUserType
      });
      return response;
    } catch (error) {
      console.error('ChatRepository - createPrivateChat error:', error);
      throw new Error('Failed to create private chat');
    }
  }

  /**
   * Criar chat em grupo
   */
  async createGroupChat(name: string, description: string, participants: Array<{ user_id: number; user_type: 'user' | 'admin' }>): Promise<ChatCreateResponse> {
    try {
      const response = await this.chatApiClient.post<ChatCreateResponse>('/chat/create-group', {
        name,
        description,
        participants
      });
      return response;
    } catch (error) {
      console.error('ChatRepository - createGroupChat error:', error);
      throw new Error('Failed to create group chat');
    }
  }

  /**
   * Buscar canais disponíveis
   */
  async getChannels(): Promise<ChatChannel[]> {
    try {
      const response = await this.chatApiClient.get<ChatChannel[]>('/chat/channels');
      return response;
    } catch (error) {
      throw new Error('Failed to fetch chat channels');
    }
  }

  /**
   * Marcar mensagens como lidas
   */
  async markAsRead(channelId: number): Promise<void> {
    try {
      await this.chatApiClient.post(`/chat/channels/${channelId}/read`);
    } catch (error) {
      throw new Error('Failed to mark messages as read');
    }
  }

  /**
   * Buscar usuários online
   */
  async getOnlineUsers(): Promise<any[]> {
    try {
      const response = await this.chatApiClient.get<any[]>('/chat/users/online');
      return response;
    } catch (error) {
      throw new Error('Failed to fetch online users');
    }
  }
} 