import { getApiConfig } from '~/config/api';
import { appendTenantQueryParam } from '~/utils/tenant';

/**
 * The languages this organisation operates in.
 *
 * Read from the PUBLIC settings endpoint on purpose: the language switcher has
 * to work for every admin, and gating it behind `setting-read` would hide the
 * control from exactly the people most likely to need it in their own
 * language. Both keys are `is_public` on the backend for the same reason.
 *
 * Deliberately self-contained rather than an addition to `useSettings`, whose
 * `publicSettings` is typed as a grouped map while the endpoint answers with a
 * flat array — untangling that is not this feature's job, and depending on it
 * would inherit the confusion.
 *
 * Never fetches at call time: `load()` from `onMounted`, the rule in
 * `useAuth.ts` and `usePermissions.ts`.
 */
export const useTenantLocales = () => {
  const enabled = useState<string[]>('tenant-locales-enabled', () => []);
  const defaultLocale = useState<string>('tenant-locales-default', () => '');
  const loaded = useState<boolean>('tenant-locales-loaded', () => false);

  const load = async (force = false): Promise<void> => {
    if (loaded.value && !force) return;

    try {
      const { publicBaseURL, tenantQueryParam } = getApiConfig();
      const url = appendTenantQueryParam(`${publicBaseURL}/settings/public`, tenantQueryParam);
      const response = await $fetch<{ data: unknown }>(url, { timeout: 5000 });

      const rows = Array.isArray(response?.data) ? response.data : [];
      const valueOf = (key: string) =>
        (rows as Array<{ key?: string; value?: unknown }>).find(r => r?.key === key)?.value;

      const rawEnabled = valueOf('locales.enabled');

      enabled.value = Array.isArray(rawEnabled)
        ? rawEnabled.map(String)
        // The setting is stored as a JSON array but a `string` type would
        // arrive as text; tolerate both rather than render an empty switcher.
        : typeof rawEnabled === 'string'
          ? (rawEnabled.trim().startsWith('[')
              ? (JSON.parse(rawEnabled) as unknown[]).map(String)
              : rawEnabled.split(',').map(s => s.trim()).filter(Boolean))
          : [];

      defaultLocale.value = String(valueOf('locales.default') ?? '');
      loaded.value = true;
    } catch {
      // A switcher that shows every language the panel ships is a far better
      // failure than one that shows none.
      enabled.value = [];
      loaded.value = true;
    }
  };

  return { enabled, defaultLocale, load };
};
