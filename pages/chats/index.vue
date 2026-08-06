<template>
  <div>
    <v-container fluid>
      <v-row class="mb-4">
        <v-col>
          <h1 class="text-h5 font-weight-bold">{{ t('pages.chats.title') }}</h1>
          <p class="text-body-2 text-grey">{{ t('pages.chats.subtitle') }}</p>
        </v-col>
      </v-row>

      <!-- Filters -->
      <v-row class="mb-4">
        <v-col cols="12" md="5">
          <v-text-field
            v-model="searchQuery"
            @input="onSearch"
            :placeholder="t('pages.chats.searchPlaceholder')"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          />
        </v-col>
      </v-row>

      <!-- Chats Table -->
      <v-card>
        <v-data-table
          :headers="headers"
          :items="chats"
          :loading="loading"
          :items-per-page="20"
          :server-items-length="pagination?.total ?? 0"
          @update:page="onPageChange"
          class="elevation-0"
        >
          <template #item.type="{ item }">
            <v-chip :color="item.type === 'group' ? 'blue' : 'purple'" size="small" label>
              {{ item.type === 'group' ? t('pages.chats.typeGroup') : t('pages.chats.typePrivate') }}
            </v-chip>
          </template>

          <template #item.name="{ item }">
            {{ item.name || (item.type === 'private' ? t('pages.chats.privateChat') : t('pages.chats.unnamedGroup')) }}
          </template>

          <template #item.messages_count="{ item }">
            <v-chip size="small" color="grey">{{ item.messages_count }}</v-chip>
          </template>

          <template #item.updated_at="{ item }">
            {{ formatDate(item.updated_at) }}
          </template>

          <template #item.actions="{ item }">
            <v-btn
              size="small"
              variant="tonal"
              color="primary"
              @click="openChat(item)"
            >
              <v-icon size="16" class="mr-1">mdi-eye</v-icon>
              {{ t('common.actions.view') }}
            </v-btn>
          </template>
        </v-data-table>
      </v-card>
    </v-container>

    <!-- Chat Messages Dialog -->
    <v-dialog v-model="messagesDialog" max-width="800" scrollable>
      <v-card v-if="selectedChat">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-message-text</v-icon>
          {{ selectedChat.name || (selectedChat.type === 'private' ? t('pages.chats.privateChat') : t('components.chatInterface.groupChat')) }}
          <v-chip :color="selectedChat.type === 'group' ? 'blue' : 'purple'" size="small" label class="ml-2">
            {{ selectedChat.type }}
          </v-chip>
          <v-spacer />
          <v-btn icon size="small" variant="text" @click="messagesDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text style="max-height: 60vh; overflow-y: auto;" ref="messagesDialogBody">
          <div v-if="loadingMessages" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <div v-else-if="chatMessages.length === 0" class="text-center pa-8 text-grey">
            {{ t('pages.chats.noMessages') }}
          </div>
          <div v-else class="messages-admin-list">
            <div
              v-for="msg in chatMessages"
              :key="msg.id"
              class="message-admin-row"
            >
              <div class="message-admin-meta">
                <v-chip size="x-small" :color="msg.sender_type === 'admin' ? 'purple' : 'blue'" class="mr-1">
                  {{ msg.sender_type }}
                </v-chip>
                <span class="text-caption text-grey">{{ formatDate(msg.created_at) }}</span>
                <v-chip v-if="msg.edited_at" size="x-small" color="amber" class="ml-1">{{ t('pages.chats.edited') }}</v-chip>
                <v-chip v-if="msg.deleted_at" size="x-small" color="error" class="ml-1">{{ t('pages.chats.deleted') }}</v-chip>
              </div>
              <div v-if="msg.content === null || msg.deleted_at" class="text-body-2 text-grey fst-italic">
                {{ t('pages.chats.messageDeleted') }}
              </div>
              <div v-else class="text-body-2 message-admin-content">{{ msg.content }}</div>
            </div>
          </div>
        </v-card-text>

        <v-divider />
        <v-card-actions>
          <span class="text-caption text-grey">{{ t('pages.chats.messagesLoaded', { count: chatMessages.length }) }}</span>
          <v-spacer />
          <v-btn @click="messagesDialog = false">{{ t('common.actions.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ApiClient } from '~/infrastructure/http/ApiClient';

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();

interface AdminChat {
  id: string;
  name: string | null;
  type: 'private' | 'group';
  messages_count: number;
  created_at: string;
  updated_at: string;
}

interface AdminMessage {
  id: string;
  chat_id: string;
  content: string | null;
  sender_id: string;
  sender_type: string;
  message_type: string;
  is_read: boolean;
  edited_at: string | null;
  reply_to_id: string | null;
  deleted_at: string | null;
  created_at: string;
}

const apiClient = new ApiClient();

const chats = ref<AdminChat[]>([]);
const loading = ref(false);
const pagination = ref<any>(null);
const searchQuery = ref('');
const currentPage = ref(1);

const selectedChat = ref<AdminChat | null>(null);
const chatMessages = ref<AdminMessage[]>([]);
const loadingMessages = ref(false);
const messagesDialog = ref(false);

const headers = computed(() => [
  { title: t('pages.chats.tableName'), key: 'name', sortable: false },
  { title: t('pages.chats.tableType'), key: 'type', sortable: false },
  { title: t('pages.chats.tableMessages'), key: 'messages_count', sortable: false },
  { title: t('pages.chats.tableLastActivity'), key: 'updated_at', sortable: false },
  { title: t('common.labels.actions'), key: 'actions', sortable: false },
]);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const loadChats = async (page = 1) => {
  loading.value = true;
  try {
    const params = new URLSearchParams({ page: String(page), per_page: '20' });
    if (searchQuery.value) params.append('q', searchQuery.value);
    const res = await apiClient.get<any>(`/admin/chats?${params}`);
    chats.value = res.data ?? [];
    pagination.value = res.pagination ?? null;
  } catch (e) {
    console.error('Failed to load chats', e);
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadChats(1), 300);
};

const onPageChange = (page: number) => {
  currentPage.value = page;
  loadChats(page);
};

const openChat = async (chat: AdminChat) => {
  selectedChat.value = chat;
  chatMessages.value = [];
  messagesDialog.value = true;
  loadingMessages.value = true;
  try {
    const res = await apiClient.get<any>(`/admin/chats/${chat.id}/messages?per_page=100`);
    chatMessages.value = res.data ?? [];
  } catch (e) {
    console.error('Failed to load chat messages', e);
  } finally {
    loadingMessages.value = false;
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dateString; }
};

onMounted(() => loadChats());
</script>

<style scoped>
.messages-admin-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.message-admin-row {
  border-left: 3px solid #e0e0e0;
  padding-left: 12px;
}
.message-admin-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}
.message-admin-content {
  word-break: break-word;
}
</style>
