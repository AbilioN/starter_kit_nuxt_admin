<template>
  <div class="chat-interface">
    <!-- Header do Chat -->
    <div class="chat-header">
      <div class="d-flex align-center justify-space-between w-100">
        <div class="d-flex align-center">
          <v-btn
            v-if="currentChat"
            @click="closeChat"
            icon
            size="small"
            variant="text"
            class="mr-2"
          >
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <v-icon color="primary" class="mr-2">mdi-chat</v-icon>
          <div>
            <h3 class="text-h6">{{ chatTitle }}</h3>
            <p v-if="currentChat" class="text-caption text-grey">
              {{ currentChat.type === 'private' ? 'Chat privado' : 'Chat em grupo' }}
            </p>
            <p v-else-if="initialUser" class="text-caption text-grey">
              {{ initialUser.email }}
            </p>
          </div>
        </div>
        <div class="d-flex align-center">
          <v-btn
            @click="testPusherConnection"
            icon
            size="small"
            variant="text"
            class="mr-2"
            title="Testar conexão Pusher"
          >
            <v-icon>mdi-wifi</v-icon>
          </v-btn>
          <v-btn
            @click="$emit('close')"
            icon
            size="small"
            variant="text"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Lista de Chats -->
    <div v-if="!currentChat && !initialUser" class="conversations-list">
      <div v-if="loading" class="text-center pa-4">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else-if="error" class="pa-4">
        <v-alert type="error" variant="tonal">
          {{ error }}
        </v-alert>
      </div>

      <div v-else-if="chats.length === 0" class="text-center pa-8">
        <v-icon size="64" color="grey" class="mb-4">mdi-chat-outline</v-icon>
        <h3 class="text-h6 mb-2">Nenhum chat</h3>
        <p class="text-body-2 text-grey">
          Inicie um chat com um usuário para começar a conversar.
        </p>
      </div>

      <div v-else class="chats">
        <div
          v-for="chat in (chats as any[])"
          :key="chat.id"
          @click="selectChat(chat)"
          class="conversation-item"
          :class="{ 'active': currentChat?.id === chat.id }"
        >
          <div class="conversation-avatar">
            <v-avatar size="48" color="primary">
              <v-icon>mdi-account</v-icon>
            </v-avatar>
            <v-badge
              v-if="chat.unread_count > 0"
              :content="chat.unread_count"
              color="error"
              dot
              class="conversation-badge"
            />
          </div>
          <div class="conversation-content">
            <div class="conversation-header">
              <h4 class="text-subtitle-1 font-weight-medium">
                {{ getChatDisplayName(chat) }}
              </h4>
              <span class="text-caption text-grey">
                {{ formatTime(chat.last_message?.created_at) }}
              </span>
            </div>
            <p class="text-body-2 text-grey conversation-preview">
              {{ chat.last_message?.content || 'Nenhuma mensagem ainda' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Atual ou Chat Direto com Usuário -->
    <div v-else class="chat-main">
      <!-- Mensagens -->
      <div
        ref="messagesContainer"
        class="chat-messages"
        @scroll="handleScroll"
      >
        <div v-if="loading" class="text-center pa-4">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <div v-else-if="error" class="pa-4">
          <v-alert type="error" variant="tonal">
            {{ error }}
          </v-alert>
        </div>

        <div v-else-if="messages.length === 0" class="text-center pa-8">
          <v-icon size="64" color="grey" class="mb-4">mdi-message-outline</v-icon>
          <h3 class="text-h6 mb-2">Nenhuma mensagem</h3>
          <p class="text-body-2 text-grey">
            {{ initialUser ? `Inicie um chat com ${initialUser.name}!` : 'Seja o primeiro a enviar uma mensagem!' }}
          </p>
        </div>

        <div v-else class="messages-list">
          <div
            v-for="message in formattedMessages"
            :key="message.id"
            class="message-item"
            :class="{ 'message-own': message.isOwn }"
          >
            <div class="message-content">
              <div class="message-header">
                <span class="message-author">{{ getMessageAuthor(message) }}</span>
                <span class="message-time">{{ message.time }}</span>
              </div>
              <div class="message-text">{{ message.content }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input de Mensagem -->
      <div class="chat-input">
        <!-- Exibir erro de envio se houver -->
        <div v-if="sendError" class="send-error mb-2">
          <v-alert type="error" variant="tonal" density="compact">
            {{ sendError }}
          </v-alert>
        </div>
        
        <v-form @submit.prevent="handleSendMessage">
          <div class="d-flex align-end">
            <v-text-field
              v-model="newMessage"
              @keydown.enter="handleSendMessage"
              :placeholder="initialUser ? `Digite uma mensagem para ${initialUser.name}...` : 'Digite sua mensagem...'"
              variant="outlined"
              density="compact"
              hide-details
              class="flex-grow-1 mr-2"
              :disabled="loading"
            />
            <v-btn
              @click="handleSendMessage"
              color="primary"
              icon
              :disabled="!newMessage.trim() || loading"
            >
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </div>
        </v-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue';
import type { ChatMessage, Chat } from '~/types/chat';

// Props
interface Props {
  initialUser?: Readonly<{ id: number; name: string; email: string }> | null;
  initialChat?: Readonly<Chat> | null;
}

const props = withDefaults(defineProps<Props>(), {
  initialChat: null,
  initialUser: null
});

// Emits
const emit = defineEmits<{
  close: [];
}>();

// Estados locais
const newMessage = ref('');
const messagesContainer = ref<HTMLElement>();
const sendError = ref('');

// Composable de chat
const {
  chats,
  currentChat,
  messages,
  loading,
  error,
  formattedMessages,
  loadChats,
  loadChatMessages,
  selectChat,
  sendMessage,
  startChatWithUser,
  getChatDisplayName,
  testPusherConnection
} = useChatManager();



// Computed
const chatTitle = computed(() => {
  if (currentChat.value) {
    return getChatDisplayName(currentChat.value);
  }
  if (props.initialUser) {
    return `Chat com ${props.initialUser.name}`;
  }
  return 'Chat';
});



// Funções
const closeChat = () => {
  emit('close');
};

const handleSendMessage = async () => {
  if (!newMessage.value.trim()) return;
  
  console.log('💬 handleSendMessage chamado:', { 
    currentChat: currentChat.value, 
    initialUser: props.initialUser,
    message: newMessage.value 
  });
  
  try {
    sendError.value = ''; // Limpar erro anterior
    
    if (currentChat.value) {
      // Se já tem um chat, enviar mensagem para ele
      console.log('💬 Enviando mensagem para chat existente:', currentChat.value.id);
      await sendMessage(newMessage.value);
      newMessage.value = ''; // Limpar apenas o campo de input
      // Não fazer scroll aqui, deixar o Pusher fazer
    } else if (props.initialUser) {
      // Se não tem chat mas tem usuário inicial, criar chat e enviar mensagem
      console.log('💬 Criando novo chat com usuário:', props.initialUser.id);
      const chat = await startChatWithUser(props.initialUser.id, 'user');
      if (chat && chat.id) {
        // Aguardar um pouco para o chat ser criado
        await nextTick();
        // Enviar a mensagem para o chat recém-criado
        await sendMessage(newMessage.value);
        newMessage.value = ''; // Limpar apenas o campo de input
        // Não fazer scroll aqui, deixar o Pusher fazer
      }
    }
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    // Mostrar erro para o usuário
    sendError.value = 'Erro ao enviar mensagem. Tente novamente.';
    // Limpar erro após 3 segundos
    setTimeout(() => {
      sendError.value = '';
    }, 3000);
  }
};

const initializeChat = async () => {
  if (props.initialUser && !currentChat.value) {
    try {
      console.log('🚀 Iniciando chat com usuário:', props.initialUser);
      const chat = await startChatWithUser(props.initialUser.id, 'user');
      
      // Após criar o chat, carregar as mensagens diretamente
      if (chat && chat.id) {
        console.log('📥 Carregando mensagens do chat criado:', chat.id);
        // Aguardar um pouco para o chat ser criado
        await nextTick();
        // Usar o loadChatMessages do useChatManager
        await loadChatMessages(chat.id);
      }
    } catch (err) {
      console.error('Erro ao inicializar chat:', err);
      sendError.value = 'Erro ao inicializar chat. Tente novamente.';
      // Limpar erro após 5 segundos
      setTimeout(() => {
        sendError.value = '';
      }, 5000);
    }
  }
};

const handleScroll = () => {
  // Implementar lógica de scroll se necessário
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const formatTime = (dateString?: string) => {
  if (!dateString) return '--:--';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '--:--';
    }
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (err) {
    console.warn('Erro ao formatar data:', err, dateString);
    return '--:--';
  }
};

const getMessageAuthor = (message: ChatMessage & { isOwn: boolean; time: string; user_name: string }) => {
  if (message.isOwn) {
    return 'Você';
  }
  return message.user_name || 'Usuário';
};

// Lifecycle
onMounted(async () => {
  // Só carregar todos os chats se não houver usuário específico
  if (!props.initialUser) {
    await loadChats();
  }
  await initializeChat();

  // Listener para scroll automático quando nova mensagem chegar via Pusher
  window.addEventListener('scroll-to-bottom', scrollToBottom);
});

onUnmounted(() => {
  // Limpar listener
  window.removeEventListener('scroll-to-bottom', scrollToBottom);
});

// Watchers
watch(() => props.initialChat, (newChat) => {
  if (newChat) {
    // Carregar o chat quando initialChat mudar
    selectChat(newChat);
  }
}, { immediate: true });

watch(() => props.initialUser, async (newUser) => {
  if (newUser && !currentChat.value) {
    try {
      await initializeChat();
    } catch (err) {
      console.error('Erro ao inicializar chat com usuário:', err);
      sendError.value = 'Erro ao inicializar chat. Tente novamente.';
      setTimeout(() => {
        sendError.value = '';
      }, 5000);
    }
  }
}, { immediate: true });

watch(currentChat, () => {
  if (currentChat.value) {
    nextTick(() => {
      scrollToBottom();
    });
  }
});

console.log('🎯 ChatInterface carregado com initialChat:', props.initialChat, 'initialUser:', props.initialUser);
</script>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 600px; /* Altura fixa do chat */
  background-color: #f8f9fa;
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  height: 80px; /* Altura fixa do header */
  flex-shrink: 0; /* Não permite que o header encolha */
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
}

.chats {
  padding: 8px;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.conversation-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.conversation-item.active {
  background-color: rgba(102, 126, 234, 0.1);
}

.conversation-avatar {
  position: relative;
  margin-right: 12px;
}

.conversation-badge {
  position: absolute;
  top: -2px;
  right: -2px;
}

.conversation-content {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.conversation-preview {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative; /* Para posicionamento absoluto do input */
  overflow: hidden; /* Previne overflow que pode esconder o input */
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  height: calc(100% - 160px); /* Altura: 100% - header(80px) - input(80px) */
  padding-bottom: 100px; /* Padding extra para garantir que o input não seja coberto */
  box-sizing: border-box;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  margin-bottom: 8px;
}

.message-item.message-own {
  justify-content: flex-end;
}

.message-content {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-own .message-content {
  background-color: #667eea;
  color: white;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.message-author {
  font-weight: 600;
  font-size: 0.875rem;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
}

.message-text {
  line-height: 1.4;
  word-wrap: break-word;
}

.chat-input {
  background-color: white;
  border-top: 1px solid #e0e0e0;
  padding: 16px;
  height: 80px; /* Altura fixa do input */
  position: absolute; /* Posicionamento absoluto */
  bottom: 0; /* Fixo na parte inferior */
  left: 0; /* Alinhado à esquerda */
  right: 0; /* Ocupa toda a largura */
  z-index: 100; /* Z-index muito alto para ficar acima de tudo */
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1); /* Sombra para destacar */
}

/* Scrollbar personalizada */
.conversations-list::-webkit-scrollbar,
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.conversations-list::-webkit-scrollbar-track,
.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.conversations-list::-webkit-scrollbar-thumb,
.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.conversations-list::-webkit-scrollbar-thumb:hover,
.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Estilos para erro de envio */
.send-error {
  margin-bottom: 8px;
}

.send-error .v-alert {
  margin: 0;
}
</style> 