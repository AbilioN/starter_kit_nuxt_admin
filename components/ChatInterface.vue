<template>
  <div class="chat-interface">
    <!-- Header do Chat -->
    <div class="chat-header">
      <div class="d-flex align-center justify-space-between w-100">
        <div class="d-flex align-center">
          <v-btn
            v-if="currentChat"
            @click="backToList"
            icon
            size="small"
            variant="text"
            class="mr-2"
            :title="initialUser ? t('common.actions.close') : t('components.chatInterface.backToList')"
          >
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <!-- Sem color="primary": o header agora É um gradiente da cor primária
               do tenant, então um ícone primário sobre ele fica invisível. -->
          <v-icon class="mr-2">mdi-chat</v-icon>
          <div>
            <h3 class="text-h6">{{ chatTitle }}</h3>
            <p v-if="currentChat" class="text-caption header-subtitle">
              {{ currentChat.type === 'private' ? t('components.chatInterface.privateChat') : t('components.chatInterface.groupChat') }}
            </p>
            <p v-else-if="initialUser" class="text-caption header-subtitle">
              {{ initialUser.email }}
            </p>
          </div>
        </div>
        <div class="d-flex align-center">
          <v-btn
            v-if="currentChatAssistant"
            @click="startNewConversationWithAgent"
            icon
            size="small"
            variant="text"
            :title="t('components.chatInterface.newConversationWithAgent')"
            class="mr-1"
          >
            <v-icon>mdi-plus-circle-outline</v-icon>
          </v-btn>
          <v-btn @click="$emit('close')" icon size="small" variant="text">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Lista de Chats -->
    <div v-if="!currentChat && !initialUser" class="conversations-list">
      <!-- User search bar -->
      <div class="pa-2">
        <v-text-field
          v-model="userSearchQuery"
          @input="onUserSearch"
          :placeholder="t('components.chatInterface.searchUserPlaceholder')"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          @click:clear="userSearchResults = []"
        />
        <div v-if="userSearchResults.length > 0" class="user-search-results mt-1">
          <div
            v-for="user in userSearchResults"
            :key="user.id"
            class="user-search-item"
            @click="startChatWith(user)"
          >
            <v-avatar size="32" color="primary" class="mr-2">
              <v-icon size="18">mdi-account</v-icon>
            </v-avatar>
            <div class="flex-1">
              <div class="text-body-2 font-weight-medium">{{ user.name }}</div>
              <div class="text-caption text-grey">{{ user.email }}</div>
            </div>
            <v-icon size="16" color="grey">mdi-message-arrow-right-outline</v-icon>
          </div>
        </div>
      </div>

      <!-- AI Agents — only shown when the tenant's plan has ai_agent enabled -->
      <div v-if="showAiAgents" class="pa-2 pt-0">
        <div class="text-caption text-grey font-weight-medium mb-1">{{ t('components.chatInterface.aiAgentsTitle') }}</div>
        <div
          v-for="assistant in assistants"
          :key="assistant.id"
          class="user-search-item agent-item"
          @click="startChatWithAgent(assistant)"
        >
          <v-avatar size="32" color="secondary" class="mr-2">
            <v-img v-if="assistant.avatar" :src="assistant.avatar" />
            <v-icon v-else size="18">mdi-robot-outline</v-icon>
          </v-avatar>
          <div class="flex-1">
            <div class="text-body-2 font-weight-medium">{{ assistant.name }}</div>
            <div v-if="assistant.description" class="text-caption text-grey">{{ assistant.description }}</div>
          </div>
          <v-icon size="16" color="grey">mdi-message-arrow-right-outline</v-icon>
        </div>
      </div>

      <div v-if="loading" class="text-center pa-4">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else-if="error" class="pa-4">
        <v-alert type="error" variant="tonal">{{ error }}</v-alert>
      </div>

      <div v-else-if="chats.length === 0" class="text-center pa-8">
        <v-icon size="64" color="grey" class="mb-4">mdi-chat-outline</v-icon>
        <h3 class="text-h6 mb-2">{{ t('components.chatInterface.noChats') }}</h3>
        <p class="text-body-2 text-grey">{{ t('components.chatInterface.noChatsHint') }}</p>
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
              <h4 class="text-subtitle-1 font-weight-medium">{{ getChatDisplayName(chat) }}</h4>
              <span class="text-caption text-grey">{{ formatTime(chat.last_message?.created_at) }}</span>
            </div>
            <p class="text-body-2 text-grey conversation-preview">
              {{ chat.last_message?.content || t('pages.chats.noMessages') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Atual -->
    <div v-else class="chat-main">
      <div ref="messagesContainer" class="chat-messages" @scroll="handleScroll">
        <div v-if="loading" class="text-center pa-4">
          <v-progress-circular indeterminate color="primary" />
        </div>
        <div v-else-if="messages.length === 0" class="text-center pa-8">
          <v-icon size="64" color="grey" class="mb-4">mdi-message-outline</v-icon>
          <p class="text-body-2 text-grey">{{ t('components.chatInterface.noMessagesYet') }}</p>
        </div>
        <div v-else class="messages-list">
          <div
            v-for="message in formattedMessages"
            :key="message.id"
            class="message-wrapper"
            :class="{ 'message-own': message.isOwn }"
          >
            <!-- Reply preview inside bubble -->
            <div v-if="message.reply" class="reply-preview" :class="{ 'reply-own': message.isOwn }">
              <v-icon size="12" class="mr-1">mdi-reply</v-icon>
              <span class="text-caption reply-text">
                {{ message.reply.content ?? t('components.chatInterface.messageDeleted') }}
              </span>
            </div>

            <div class="message-bubble" :class="{ 'bubble-own': message.isOwn, 'bubble-assistant': message.sender_type === 'assistant' }">
              <div class="message-header">
                <span class="message-author">
                  <v-icon v-if="message.sender_type === 'assistant'" size="12" class="mr-1">mdi-robot-outline</v-icon>
                  {{ message.isOwn ? t('components.chatInterface.you') : (message.user_name || t('components.chatInterface.user')) }}
                </span>
                <span class="message-time">{{ message.time }}</span>
              </div>

              <!-- Deleted message -->
              <div v-if="message.content === null" class="message-deleted">
                <v-icon size="14" class="mr-1">mdi-minus-circle-outline</v-icon>
                <span class="text-caption fst-italic">{{ t('components.chatInterface.messageDeleted') }}</span>
              </div>
              <div v-else class="message-text">{{ message.content }}</div>

              <!-- Edited label + read ticks -->
              <div class="message-meta">
                <span v-if="message.edited_at" class="text-caption edited-label">{{ t('components.chatInterface.edited') }}</span>
                <span v-if="message.isOwn" class="read-ticks" :title="message.is_read ? t('components.chatInterface.read') : t('components.chatInterface.sent')">
                  <!-- Sem cor fixa: o "enviado" herda a cor do texto do balão
                       (on-primary, que o Vuetify recalcula por contraste), então
                       funciona tanto com primária clara quanto escura. -->
                  <v-icon
                    size="12"
                    class="read-tick"
                    :class="{ 'read-tick--read': message.is_read }"
                  >
                    {{ message.is_read ? 'mdi-check-all' : 'mdi-check' }}
                  </v-icon>
                </span>
              </div>
            </div>

            <!-- Message actions (own messages only, not deleted) -->
            <div v-if="message.isOwn && message.content !== null" class="message-actions">
              <v-btn icon size="x-small" variant="text" @click="startReply(message)">
                <v-icon size="14">mdi-reply</v-icon>
              </v-btn>
              <v-btn icon size="x-small" variant="text" @click="startEdit(message)">
                <v-icon size="14">mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon size="x-small" variant="text" color="error" @click="confirmDelete(message)">
                <v-icon size="14">mdi-delete</v-icon>
              </v-btn>
            </div>
            <!-- Reply action for others' messages -->
            <div v-else-if="!message.isOwn && message.content !== null" class="message-actions message-actions-left">
              <v-btn icon size="x-small" variant="text" @click="startReply(message)">
                <v-icon size="14">mdi-reply</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
      </div>

      <!-- Typing indicator -->
      <div v-if="typingUserNames.length > 0" class="typing-indicator">
        <v-icon size="14" class="mr-1">mdi-dots-horizontal</v-icon>
        {{ typingUserNames.join(', ') }} {{ typingUserNames.length === 1 ? t('components.chatInterface.isTyping') : t('components.chatInterface.areTyping') }}
      </div>

      <!-- Input de Mensagem -->
      <div class="chat-input">
        <!-- Reply banner -->
        <div v-if="replyTo" class="reply-banner">
          <v-icon size="14" class="mr-1">mdi-reply</v-icon>
          <span class="text-caption flex-1 reply-preview-text">{{ replyTo.content }}</span>
          <v-btn icon size="x-small" variant="text" @click="replyTo = null">
            <v-icon size="14">mdi-close</v-icon>
          </v-btn>
        </div>

        <!-- Edit banner -->
        <div v-if="editingMessage" class="edit-banner">
          <v-icon size="14" class="mr-1">mdi-pencil</v-icon>
          <span class="text-caption">{{ t('components.chatInterface.editingMessage') }}</span>
          <v-btn icon size="x-small" variant="text" class="ml-auto" @click="cancelEdit">
            <v-icon size="14">mdi-close</v-icon>
          </v-btn>
        </div>

        <div v-if="sendError" class="mb-2">
          <v-alert type="error" variant="tonal" density="compact">{{ sendError }}</v-alert>
        </div>

        <v-form @submit.prevent="handleSendMessage">
          <div class="d-flex align-end">
            <v-text-field
              v-model="newMessage"
              ref="inputField"
              @keydown.enter.prevent="handleSendMessage"
              @input="onTyping"
              :placeholder="replyTo ? t('components.chatInterface.replyPlaceholder') : editingMessage ? t('components.chatInterface.editPlaceholder') : t('components.chatInterface.messagePlaceholder')"
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

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="380">
      <v-card>
        <v-card-title>{{ t('components.chatInterface.deleteDialogTitle') }}</v-card-title>
        <v-card-text>{{ t('components.chatInterface.deleteDialogBody') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">{{ t('common.actions.cancel') }}</v-btn>
          <v-btn color="error" @click="executeDelete">{{ t('common.actions.delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue';
import type { ChatMessage, Chat } from '~/types/chat';

const { t } = useI18n();

interface Props {
  initialUser?: Readonly<{ id: string | number; name: string; email: string }> | null;
  initialChat?: Readonly<Chat> | null;
}

const props = withDefaults(defineProps<Props>(), {
  initialChat: null,
  initialUser: null,
});

const emit = defineEmits<{ close: [] }>();

const newMessage = ref('');
const messagesContainer = ref<HTMLElement>();
const inputField = ref<any>();
const sendError = ref('');
const isInitializing = ref(false);
const editingMessage = ref<ChatMessage | null>(null);
const deleteDialog = ref(false);
const deletingMessageId = ref<string | null>(null);
const userSearchQuery = ref('');
const userSearchResults = ref<Array<{ id: string; name: string; email: string; last_seen_at: string | null }>>([]);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const {
  chats,
  currentChat,
  messages,
  loading,
  error,
  formattedMessages,
  typingUserNames,
  loadChats,
  loadChatMessages,
  selectChat,
  sendMessage,
  startChatWithUser,
  getChatDisplayName,
  testPusherConnection,
  resetChat,
  editMessage,
  deleteMessage,
  searchUsers,
  markCurrentChatAsRead,
  replyTo,
  sendTypingIndicator,
} = useChatManager();

const { assistants, loadAssistants } = useAssistants();
const { isFeatureEnabled, featureFlags, loadSettings } = useSettings();
const showAiAgents = computed(() => isFeatureEnabled('ai_agent') && assistants.value.length > 0);

const startChatWithAgent = async (assistant: { id: string; name: string; description: string | null }) => {
  await startChatWithUser(assistant.id, 'assistant');
  if (currentChat.value) {
    await loadChatMessages(currentChat.value.id);
  }
};

// Private chats have no participant-type field of their own - chat.name is
// just the other participant's name (see Chat::toEntityFromReciever on the
// backend) - so matching it against the loaded agent list is the only way
// to tell "this open chat is with an AI agent" without a dedicated field.
const currentChatAssistant = computed(() => {
  if (!currentChat.value) return null;
  return assistants.value.find(a => a.name === currentChat.value?.name) ?? null;
});

const startNewConversationWithAgent = async () => {
  const assistant = currentChatAssistant.value;
  if (!assistant) return;
  await startChatWithUser(assistant.id, 'assistant', true);
  if (currentChat.value) {
    await loadChatMessages(currentChat.value.id);
  }
};

const chatTitle = computed(() => {
  if (currentChat.value) return getChatDisplayName(currentChat.value);
  if (props.initialUser) return t('components.chatInterface.chatWith', { name: props.initialUser.name });
  return t('components.chatInterface.chatDefaultTitle');
});

// A seta volta para a lista de conversas em vez de fechar o widget. Exceção:
// no modo `initialUser` (aberto a partir da página de um usuário) o componente
// está preso a uma conversa só — não existe lista atrás, então voltar = fechar.
const backToList = async () => {
  if (props.initialUser) {
    emit('close');
    return;
  }
  resetChat();
  // Recarrega para a lista já refletir a última mensagem e o contador de não
  // lidas da conversa que acabou de ser fechada.
  await loadChats();
};

const handleSendMessage = async () => {
  if (!newMessage.value.trim()) return;
  try {
    sendError.value = '';
    if (editingMessage.value) {
      await editMessage(editingMessage.value.id, newMessage.value);
      newMessage.value = '';
      editingMessage.value = null;
    } else if (currentChat.value) {
      await sendMessage(newMessage.value);
      newMessage.value = '';
    } else if (props.initialUser) {
      const chat = await startChatWithUser(props.initialUser.id, 'user');
      if (chat?.id) {
        await nextTick();
        await sendMessage(newMessage.value);
        newMessage.value = '';
      }
    }
    scrollToBottom();
  } catch (err) {
    sendError.value = t('components.chatInterface.sendErrorGeneric');
    setTimeout(() => { sendError.value = ''; }, 3000);
  }
};

const startReply = (msg: ChatMessage & any) => {
  replyTo.value = msg;
  nextTick(() => inputField.value?.$el?.querySelector('input')?.focus());
};

const startEdit = (msg: ChatMessage & any) => {
  editingMessage.value = msg;
  newMessage.value = msg.content ?? '';
  nextTick(() => inputField.value?.$el?.querySelector('input')?.focus());
};

const cancelEdit = () => {
  editingMessage.value = null;
  newMessage.value = '';
};

const confirmDelete = (msg: ChatMessage & any) => {
  deletingMessageId.value = msg.id;
  deleteDialog.value = true;
};

const executeDelete = async () => {
  if (!deletingMessageId.value) return;
  deleteDialog.value = false;
  try {
    await deleteMessage(deletingMessageId.value);
  } catch {
    sendError.value = t('components.chatInterface.deleteErrorGeneric');
    setTimeout(() => { sendError.value = ''; }, 3000);
  }
  deletingMessageId.value = null;
};

const onUserSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  if (!userSearchQuery.value.trim()) {
    userSearchResults.value = [];
    return;
  }
  searchTimeout = setTimeout(async () => {
    userSearchResults.value = await searchUsers(userSearchQuery.value);
  }, 300);
};

const startChatWith = async (user: any) => {
  userSearchQuery.value = '';
  userSearchResults.value = [];
  await startChatWithUser(user.id, 'user');
  if (currentChat.value) {
    await loadChatMessages(currentChat.value.id);
  }
};

let typingTimeout: ReturnType<typeof setTimeout> | null = null;
const onTyping = () => {
  if (!currentChat.value?.id) return;
  sendTypingIndicator(currentChat.value.id);
  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    // Typing stopped — backend handles stop on send
  }, 2000);
};

const initializeChat = async () => {
  if (!props.initialUser || isInitializing.value) return;
  isInitializing.value = true;
  try {
    resetChat();
    const chat = await startChatWithUser(props.initialUser.id, 'user');
    if (chat?.id) {
      await nextTick();
      await loadChatMessages(chat.id);
    }
  } catch {
    sendError.value = t('components.chatInterface.initErrorGeneric');
    setTimeout(() => { sendError.value = ''; }, 5000);
  } finally {
    isInitializing.value = false;
  }
};

const handleScroll = () => {};

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
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return '--:--'; }
};

onMounted(async () => {
  if (!props.initialUser) {
    await loadChats();
    loadAssistants();
    // features.ai_agent isn't public (is_public=false, same as most plan
    // feature flags), so the boot-time useTenantTheme/publicSettings fetch
    // never carries it — nothing else loads the authenticated settings list
    // outside the /settings pages, and this widget is global/floating, so
    // most admins would open it without ever having visited Settings first.
    // Without this, showAiAgents silently stays false even when the
    // tenant's plan genuinely has the feature enabled.
    if (featureFlags.value.length === 0) {
      loadSettings('features');
    }
  }
  window.addEventListener('scroll-to-bottom', scrollToBottom);
});

onUnmounted(() => {
  window.removeEventListener('scroll-to-bottom', scrollToBottom);
  resetChat();
});

watch(() => props.initialChat, (c) => { if (c) selectChat(c); }, { immediate: true });
watch(() => props.initialUser, async (u) => { if (u) await initializeChat(); }, { immediate: true });
watch(currentChat, async (chat) => {
  if (chat) {
    nextTick(scrollToBottom);
    await markCurrentChatAsRead();
  }
});
</script>

<style scoped>
/*
 * Cores: nada de hex fixo aqui. O Vuetify publica cada cor do tema como uma
 * CSS var com o triplete RGB cru (`--v-theme-primary: 15,118,110`), e o
 * composable `useTenantTheme` sobrescreve `primary`/`secondary` em runtime com
 * a marca do tenant (GET /api/tenant/theme) — então usar essas vars faz o chat
 * seguir o tenant sozinho, sem prop nem watcher.
 *
 * Mapeamento: `primary` = o usuário/a marca (header, balão próprio, destaques);
 * `secondary` = o agente de IA. Usar as duas cores que o tenant realmente
 * configura mantém o balão do agente distinguível do balão próprio — se ambos
 * fossem `primary`, a conversa com IA ficaria ilegível.
 *
 * `on-primary`/`on-surface` são gerados pelo próprio Vuetify por contraste, e
 * recalculados quando a cor muda: é o que evita texto branco sobre uma primária
 * clara se o tenant escolher, digamos, amarelo.
 */
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 600px;
  background-color: rgb(var(--v-theme-background));
}

.chat-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  color: rgb(var(--v-theme-on-primary));
  padding: 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-primary), 0.12);
  height: 80px;
  flex-shrink: 0;
}
.header-subtitle {
  color: rgb(var(--v-theme-on-primary));
  opacity: 0.75;
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
}

.user-search-results {
  border: 1px solid rgb(var(--v-theme-borderColor));
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.user-search-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.15s;
}
.user-search-item:hover { background-color: rgba(var(--v-theme-primary), 0.06); }
.agent-item { border-radius: 8px; }
.agent-item:hover { background-color: rgba(var(--v-theme-secondary), 0.12); }

.chats { padding: 8px; }

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.conversation-item:hover { background-color: rgba(var(--v-theme-primary), 0.06); }
.conversation-item.active { background-color: rgba(var(--v-theme-primary), 0.12); }
.conversation-avatar { position: relative; margin-right: 12px; }
.conversation-badge { position: absolute; top: -2px; right: -2px; }
.conversation-content { flex: 1; min-width: 0; }
.conversation-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.conversation-preview { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.chat-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 120px;
  box-sizing: border-box;
}

.messages-list { display: flex; flex-direction: column; gap: 4px; }

.message-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
}
.message-wrapper:hover .message-actions { opacity: 1; }
.message-wrapper.message-own { align-items: flex-end; }

.reply-preview {
  display: flex;
  align-items: center;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-left: 3px solid rgb(var(--v-theme-primary));
  border-radius: 4px 4px 0 0;
  padding: 2px 8px;
  max-width: 70%;
}
.reply-preview.reply-own {
  border-left-color: rgba(var(--v-theme-on-primary), 0.6);
  background: rgba(var(--v-theme-primary), 0.18);
}
.reply-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.message-bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 12px;
  background-color: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
.message-bubble.bubble-own {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  border-radius: 12px 12px 4px 12px;
}
.message-bubble.bubble-assistant {
  background-color: rgba(var(--v-theme-secondary), 0.12);
  border: 1px solid rgba(var(--v-theme-secondary), 0.35);
  color: rgb(var(--v-theme-on-surface));
  border-radius: 12px 12px 12px 4px;
}
.message-bubble.bubble-assistant .message-author { color: rgb(var(--v-theme-secondary)); }

.message-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; gap: 8px; }
.message-author { font-weight: 600; font-size: 0.8rem; }
.message-time { font-size: 0.72rem; opacity: 0.7; }
.message-text { line-height: 1.4; word-wrap: break-word; }
.message-deleted { opacity: 0.5; display: flex; align-items: center; }

.message-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 2px;
}
.edited-label { font-size: 0.65rem; opacity: 0.65; }
.read-ticks { display: flex; align-items: center; }
/* Herda a cor do texto do balão; "lido" ganha destaque com a cor `info` do tema. */
.read-tick { opacity: 0.6; }
.read-tick--read { opacity: 1; color: rgb(var(--v-theme-info)); }

.message-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
  margin-top: 2px;
  align-self: flex-end;
}
.message-actions-left { align-self: flex-start; }

.typing-indicator {
  padding: 4px 16px;
  font-size: 0.75rem;
  color: rgb(var(--v-theme-textSecondary));
  display: flex;
  align-items: center;
}

.chat-input {
  background-color: rgb(var(--v-theme-surface));
  border-top: 1px solid rgb(var(--v-theme-borderColor));
  padding: 12px 16px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.08);
}

.reply-banner, .edit-banner {
  display: flex;
  align-items: center;
  background: rgba(var(--v-theme-primary), 0.08);
  border-left: 3px solid rgb(var(--v-theme-primary));
  border-radius: 4px;
  padding: 4px 8px;
  margin-bottom: 6px;
  font-size: 0.78rem;
  color: rgb(var(--v-theme-textSecondary));
}
.reply-preview-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }

.conversations-list::-webkit-scrollbar,
.chat-messages::-webkit-scrollbar { width: 6px; }
.conversations-list::-webkit-scrollbar-track,
.chat-messages::-webkit-scrollbar-track { background: rgba(var(--v-theme-on-surface), 0.06); border-radius: 3px; }
.conversations-list::-webkit-scrollbar-thumb,
.chat-messages::-webkit-scrollbar-thumb { background: rgba(var(--v-theme-on-surface), 0.22); border-radius: 3px; }
</style>
