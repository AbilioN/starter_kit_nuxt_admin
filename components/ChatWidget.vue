<template>
  <div class="chat-widget">
    <!-- Botão flutuante para abrir/fechar chat -->
    <v-btn
      v-if="!isOpen"
      @click="toggleChat"
      color="primary"
      icon
      size="large"
      class="chat-toggle-btn"
      elevation="8"
    >
      <v-icon>mdi-chat</v-icon>
      <v-badge
        v-if="unreadCount > 0"
        :content="unreadCount"
        color="error"
        dot
      />
    </v-btn>

    <!-- Container principal do chat -->
    <v-card
      v-if="isOpen"
      class="chat-container"
      elevation="12"
      width="400"
      height="600"
    >
      <!-- Header do chat -->
      <v-card-title class="chat-header">
        <div class="d-flex align-center justify-space-between w-100">
          <div class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-chat</v-icon>
            <span class="text-h6">Chat</span>
            <v-chip
              v-if="isConnected"
              color="success"
              size="small"
              class="ml-2"
            >
              Online
            </v-chip>
          </div>
          <v-btn
            @click="toggleChat"
            icon
            size="small"
            variant="text"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>

      <!-- Conteúdo do chat -->
      <v-card-text class="chat-content pa-0">
        <!-- Lista de canais -->
        <div v-if="!currentChannel" class="channels-list">
          <v-list>
            <v-list-item
              v-for="channel in channels"
              :key="channel.id"
              @click="switchChannel(channel)"
              :active="false"
              class="channel-item"
            >
              <template #prepend>
                <v-icon
                  :icon="channel.type === 'public' ? 'mdi-pound' : 'mdi-lock'"
                  :color="channel.type === 'public' ? 'primary' : 'grey'"
                />
              </template>
              <v-list-item-title>{{ channel.name }}</v-list-item-title>
              <template #append>
                <v-badge
                  v-if="channel.unread_count > 0"
                  :content="channel.unread_count"
                  color="error"
                />
              </template>
            </v-list-item>
          </v-list>
        </div>

        <!-- Chat do canal atual -->
        <div v-else class="chat-main">
          <!-- Header do canal -->
          <div class="channel-header pa-3 border-b">
            <div class="d-flex align-center justify-space-between">
              <div>
                <h3 class="text-h6">{{ currentChannel.name }}</h3>
                <p class="text-caption text-grey">
                  {{ onlineUsers.length }} usuários online
                </p>
              </div>
              <v-btn
                @click="currentChannel = null"
                icon
                size="small"
                variant="text"
              >
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
            </div>
          </div>

          <!-- Mensagens -->
          <div
            ref="messagesContainer"
            class="chat-messages"
            @scroll="handleScroll"
          >
            <div v-if="loading" class="text-center pa-4">
              <v-progress-circular indeterminate color="primary" />
            </div>

            <div v-else-if="error" class="text-center pa-4">
              <v-alert type="error" variant="tonal">
                {{ error }}
              </v-alert>
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
                    <span class="message-author">{{ message.user_name }}</span>
                    <span class="message-time">{{ message.time }}</span>
                  </div>
                  <div class="message-text">{{ message.message }}</div>
                </div>
              </div>
            </div>

            <!-- Indicador de digitação -->
            <div v-if="typingText" class="typing-indicator pa-2">
              <v-chip size="small" color="grey" variant="tonal">
                <v-icon size="small" class="mr-1">mdi-pencil</v-icon>
                {{ typingText }}
              </v-chip>
            </div>
          </div>

          <!-- Input de mensagem -->
          <div class="chat-input pa-3 border-t">
            <v-form @submit.prevent="handleSendMessage">
              <div class="d-flex align-end">
                <v-text-field
                  v-model="newMessage"
                  @input="handleTyping"
                  @keydown.enter="handleSendMessage"
                  placeholder="Digite sua mensagem..."
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="flex-grow-1 mr-2"
                  :disabled="!isConnected"
                />
                <v-btn
                  @click="handleSendMessage"
                  color="primary"
                  icon
                  :disabled="!newMessage.trim() || !isConnected"
                >
                  <v-icon>mdi-send</v-icon>
                </v-btn>
              </div>
            </v-form>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import type { Chat } from '~/types/chat';

// Estados locais
const isOpen = ref(false);
const newMessage = ref('');
const unreadCount = ref(0);
const messagesContainer = ref<HTMLElement>();
let typingTimeout: NodeJS.Timeout | null = null;

// Composable do chat
const {
  messages,
  channels,
  currentChannel,
  onlineUsers,
  isConnected,
  loading,
  error,
  typingText,
  formattedMessages,
  connectToChat,
  disconnectFromChat,
  sendMessage,
  startTyping,
  stopTyping,
  loadChannels,
  switchChannel,
  scrollToBottom
} = useChat();

// Função para abrir/fechar chat
const toggleChat = () => {
  isOpen.value = !isOpen.value;
  
  if (isOpen.value) {
    // Conectar ao chat quando abrir
    nextTick(() => {
      connectToChat();
      loadChannels();
    });
  } else {
    // Desconectar quando fechar
    disconnectFromChat();
  }
};

// Função para enviar mensagem
const handleSendMessage = async () => {
  if (!newMessage.value.trim()) return;
  
  await sendMessage(newMessage.value);
  newMessage.value = '';
};

// Função para lidar com digitação
const handleTyping = () => {
  startTyping();
  
  // Limpar timeout anterior
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }
  
  // Parar de digitar após 2 segundos
  typingTimeout = setTimeout(() => {
    stopTyping();
  }, 2000);
};

// Função para lidar com scroll
const handleScroll = () => {
  // Implementar lógica de scroll se necessário
};

// Lifecycle hooks
onMounted(() => {
  // Conectar automaticamente se o chat estiver aberto
  if (isOpen.value) {
    connectToChat();
    loadChannels();
  }
});

onUnmounted(() => {
  // Limpar timeout e desconectar
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }
  disconnectFromChat();
});
</script>

<style scoped>
.chat-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.chat-toggle-btn {
  position: relative;
}

.chat-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  border-radius: 12px;
  overflow: hidden;
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-content {
  height: calc(100% - 64px);
  display: flex;
  flex-direction: column;
}

.channels-list {
  flex: 1;
  overflow-y: auto;
}

.channel-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.channel-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.chat-main {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.channel-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f8f9fa;
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

.typing-indicator {
  display: flex;
  justify-content: flex-start;
}

.chat-input {
  background-color: white;
  border-top: 1px solid #e0e0e0;
}

.border-b {
  border-bottom: 1px solid #e0e0e0;
}

.border-t {
  border-top: 1px solid #e0e0e0;
}

/* Scrollbar personalizada */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 