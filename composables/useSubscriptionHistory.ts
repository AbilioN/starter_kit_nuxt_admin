import type { Pagination, SubscriptionCurrentPlan, SubscriptionHistoryEntry } from '~/types/api';
import { TenantService } from '~/services/TenantService';

export const useSubscriptionHistory = () => {
  // Dentro do composable: o construtor chega a useRuntimeConfig().
  const tenantService = new TenantService();

  const entries = ref<SubscriptionHistoryEntry[]>([]);
  const currentPlan = ref<SubscriptionCurrentPlan | null>(null);
  const loading = ref(false);
  const loaded = ref(false);
  const error = ref('');
  const pagination = ref<Pagination>({
    total: 0, per_page: 15, current_page: 1, last_page: 1, from: 0, to: 0,
  });

  const { t, te } = useI18n();

  const loadHistory = async (page = 1) => {
    loading.value = true;
    error.value = '';

    const result = await tenantService.getSubscriptionHistory(page);
    if (result.success && result.data) {
      entries.value = result.data.data;
      currentPlan.value = result.data.current_plan;
      pagination.value = result.data.pagination;
    } else {
      error.value = result.error ?? t('pages.profile.historyLoadFailed');
    }

    loaded.value = true;
    loading.value = false;
  };

  /** Consistente com formatPrice de pages/pricing.vue — o backend não devolve
   *  moeda, então o `$` é fixo aqui como lá. Limitação conhecida. */
  const formatAmount = (cents: number | null): string => {
    if (cents === null || cents === 0) return t('pages.profile.free');
    return `$${(cents / 100).toFixed(2)}`;
  };

  const statusColor = (status: string): string => ({
    succeeded: 'success',
    paid: 'success',
    pending: 'warning',
    failed: 'error',
    refunded: 'info',
    cancelled: 'grey',
  }[status] ?? 'grey');

  /** Traduz se houver chave; senão devolve o valor cru, para um enum novo do
   *  backend aparecer legível em vez de "pages.profile.statusXyz". */
  const label = (prefix: string, value: string | null): string => {
    if (!value) return '—';
    const key = `pages.profile.${prefix}${value.charAt(0).toUpperCase()}${value.slice(1).replace(/_(\w)/g, (_, c) => c.toUpperCase())}`;
    return te(key) ? t(key) : value;
  };

  const statusLabel = (status: string) => label('status', status);
  const triggerLabel = (trigger: string | null) => label('trigger', trigger);

  return {
    entries,
    currentPlan,
    loading,
    loaded,
    error,
    pagination,
    loadHistory,
    formatAmount,
    statusColor,
    statusLabel,
    triggerLabel,
  };
};
