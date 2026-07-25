<template>
  <div class="chat-widget">
    <!-- Floating button -->
    <v-btn
      v-if="!isOpen"
      color="primary"
      icon
      size="large"
      class="chat-toggle-btn"
      elevation="8"
      @click="open"
    >
      <v-badge v-if="totalUnread > 0" :content="totalUnread > 99 ? '99+' : totalUnread" color="error">
        <v-icon>mdi-chat</v-icon>
      </v-badge>
      <v-icon v-else>mdi-chat</v-icon>
    </v-btn>

    <!-- Chat dialog -->
    <v-card
      v-if="isOpen"
      class="chat-container"
      elevation="12"
      width="420"
      height="620"
    >
      <ChatInterface @close="close" />
    </v-card>
  </div>
</template>

<script setup lang="ts">
const isOpen = ref(false);
const { totalUnread, resetChat } = useChatManager();

const open = () => { isOpen.value = true; };

const close = () => {
  isOpen.value = false;
  resetChat();
};
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
  border-radius: 12px !important;
  overflow: hidden;
}
</style>
