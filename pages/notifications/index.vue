<script setup lang="ts">
import { onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const { notifications, unreadCount, loading, error, loadNotifications, markRead, markAllRead, formatTimeAgo } =
  useAdminNotifications();

const unreadOnly = ref(false);

onMounted(() => loadNotifications(unreadOnly.value));

watch(unreadOnly, () => loadNotifications(unreadOnly.value));
</script>

<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">{{ t('pages.notifications.title') }}</h1>
            <p class="text-body-1 text-medium-emphasis">
              {{ t('pages.notifications.subtitle') }}
            </p>
          </div>
          <div class="d-flex gap-3 align-center">
            <v-switch v-model="unreadOnly" :label="t('pages.notifications.unreadOnly')" color="primary" hide-details density="compact" />
            <v-btn
              v-if="unreadCount > 0"
              variant="outlined"
              prepend-icon="mdi-check-all"
              @click="markAllRead"
            >
              {{ t('pages.notifications.markAllRead') }}
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row v-if="loading">
      <v-col cols="12">
        <UiChildCard>
          <div class="d-flex justify-center py-12">
            <v-progress-circular indeterminate color="primary" size="64" />
          </div>
        </UiChildCard>
      </v-col>
    </v-row>

    <v-row v-else-if="error">
      <v-col cols="12">
        <v-alert type="error" variant="tonal">{{ error }}</v-alert>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12">
        <UiChildCard>
          <div v-if="notifications.length === 0" class="d-flex flex-column align-center py-16 text-medium-emphasis">
            <v-icon size="64" class="mb-4">mdi-bell-off-outline</v-icon>
            <p class="text-h6">{{ t('pages.notifications.noNotifications', { suffix: unreadOnly ? t('pages.notifications.unreadSuffix') : '' }) }}</p>
            <p class="text-body-2 mt-1">{{ t('pages.notifications.allCaughtUp') }}</p>
          </div>

          <v-list v-else lines="two">
            <template v-for="(n, i) in notifications" :key="n.id">
              <v-divider v-if="i > 0" />
              <v-list-item
                :class="{ 'bg-blue-lighten-5': !n.read_at }"
                @click="markRead(n.id)"
                style="cursor: pointer;"
              >
                <template #prepend>
                  <v-avatar size="44" :color="n.read_at ? 'grey-lighten-3' : 'primary'" class="mr-3">
                    <v-icon size="20" :color="n.read_at ? 'grey' : 'white'">mdi-bell</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium">{{ n.data.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ n.data.message }}</v-list-item-subtitle>

                <template #append>
                  <div class="d-flex flex-column align-end gap-1">
                    <span class="text-caption text-medium-emphasis">{{ formatTimeAgo(n.created_at) }}</span>
                    <v-chip v-if="!n.read_at" color="primary" size="x-small" variant="tonal">{{ t('pages.notifications.new') }}</v-chip>
                  </div>
                </template>
              </v-list-item>
            </template>
          </v-list>
        </UiChildCard>
      </v-col>
    </v-row>
  </div>
</template>
