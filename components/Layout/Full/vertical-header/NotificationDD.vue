<script setup lang="ts">
import { onMounted } from 'vue';

const { notifications, unreadCount, loadUnreadCount, loadNotifications, markRead, markAllRead, formatTimeAgo } =
  useAdminNotifications();

onMounted(() => loadUnreadCount());

const open = ref(false);

const handleOpen = async () => {
  open.value = true;
  await loadNotifications(false, 10);
};

const handleMarkRead = async (id: string) => {
  await markRead(id);
};

const handleMarkAll = async () => {
  await markAllRead();
};
</script>

<template>
  <v-menu v-model="open" :close-on-content-click="false" location="bottom end" width="360">
    <template #activator="{ props }">
      <v-btn icon variant="text" v-bind="props" class="custom-hover-primary ml-0 ml-md-5 text-muted" @click="handleOpen">
        <v-badge v-if="unreadCount > 0" :content="unreadCount > 99 ? '99+' : unreadCount" color="error">
          <v-icon>mdi-bell-outline</v-icon>
        </v-badge>
        <v-icon v-else>mdi-bell-outline</v-icon>
      </v-btn>
    </template>

    <v-card elevation="8" rounded="xl">
      <div class="d-flex align-center justify-space-between pa-4 pb-2">
        <span class="text-subtitle-1 font-weight-bold">Notifications</span>
        <div class="d-flex gap-2">
          <v-btn v-if="unreadCount > 0" size="x-small" variant="text" color="primary" @click="handleMarkAll">
            Mark all read
          </v-btn>
          <v-btn size="x-small" variant="text" to="/notifications" @click="open = false">View all</v-btn>
        </div>
      </div>

      <v-divider />

      <div style="max-height: 320px; overflow-y: auto;">
        <div v-if="notifications.length === 0" class="pa-6 text-center text-medium-emphasis">
          <v-icon size="40" class="mb-2">mdi-bell-off-outline</v-icon>
          <div class="text-body-2">No notifications</div>
        </div>

        <v-list v-else lines="two" density="compact">
          <v-list-item
            v-for="n in notifications"
            :key="n.id"
            :class="{ 'bg-blue-lighten-5': !n.read_at }"
            @click="handleMarkRead(n.id)"
            style="cursor: pointer;"
          >
            <template #prepend>
              <v-avatar size="36" :color="n.read_at ? 'grey-lighten-3' : 'primary'" class="mr-2">
                <v-icon size="18" :color="n.read_at ? 'grey' : 'white'">mdi-bell</v-icon>
              </v-avatar>
            </template>
            <v-list-item-title class="text-body-2 font-weight-medium">{{ n.data.title }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption">{{ n.data.message }}</v-list-item-subtitle>
            <template #append>
              <span class="text-caption text-medium-emphasis ml-2" style="white-space: nowrap;">
                {{ formatTimeAgo(n.created_at) }}
              </span>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </v-card>
  </v-menu>
</template>
