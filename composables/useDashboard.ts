import { ApiClient } from '~/infrastructure/http/ApiClient';

export interface DashboardMetrics {
  users: {
    total: number;
    new_this_week: number;
    new_this_month: number;
    per_day_last_7: Array<{ date: string; count: number }>;
  };
  admins: { total: number };
  chats: {
    total: number;
    messages_this_week: number;
    messages_per_day_last_7: Array<{ date: string; count: number }>;
  };
  audit: { action_distribution: Record<string, number> };
  storage: { total_files: number; bytes_used: number };
}

export const useDashboard = () => {
  const metrics = ref<DashboardMetrics | null>(null);
  const loading = ref(false);
  const error = ref('');

  const apiClient = new ApiClient();

  const loadMetrics = async () => {
    loading.value = true;
    error.value = '';
    try {
      const res = await apiClient.get<{ success: boolean; data: DashboardMetrics }>('/dashboard');
      if (res.success) metrics.value = res.data;
    } catch (err: any) {
      error.value = err.message ?? 'Failed to load dashboard metrics.';
    } finally {
      loading.value = false;
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return { metrics, loading, error, loadMetrics, formatBytes };
};
