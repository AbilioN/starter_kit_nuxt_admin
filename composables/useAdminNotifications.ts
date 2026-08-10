import type { Pagination } from '~/types/api';
import { ApiClient } from '~/infrastructure/http/ApiClient';

export interface DbNotification {
  id: string;
  type: string;
  data: { title: string; message: string; action_url?: string | null };
  read_at: string | null;
  created_at: string;
}

export const useAdminNotifications = () => {
  const notifications = ref<DbNotification[]>([]);
  const unreadCount = ref(0);
  const loading = ref(false);
  const error = ref('');

  const apiClient = new ApiClient();

  const loadUnreadCount = async () => {
    try {
      const res = await apiClient.get<{ success: boolean; count: number }>('/notifications/unread-count');
      if (res.success) unreadCount.value = res.count;
    } catch {
      // fail silently — bell count is non-critical
    }
  };

  const loadNotifications = async (unreadOnly = false, perPage = 20) => {
    loading.value = true;
    error.value = '';
    try {
      const params = `?per_page=${perPage}${unreadOnly ? '&unread_only=1' : ''}`;
      const res = await apiClient.get<{ success: boolean; data: DbNotification[]; pagination: Pagination }>(
        `/notifications${params}`
      );
      if (res.success) {
        notifications.value = res.data;
        unreadCount.value = res.data.filter(n => !n.read_at).length;
      }
    } catch (err: any) {
      error.value = err.message ?? 'Failed to load notifications.';
    } finally {
      loading.value = false;
    }
  };

  const markRead = async (id: string) => {
    try {
      await apiClient.post(`/notifications/${id}/read`);
      const n = notifications.value.find(n => n.id === id);
      if (n && !n.read_at) {
        n.read_at = new Date().toISOString();
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } catch {
      // fail silently
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/read-all');
      notifications.value.forEach(n => { n.read_at = n.read_at ?? new Date().toISOString(); });
      unreadCount.value = 0;
    } catch {
      // fail silently
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadUnreadCount,
    loadNotifications,
    markRead,
    markAllRead,
    formatTimeAgo,
  };
};
