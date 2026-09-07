import { ApiError } from '~/infrastructure/http/ApiClient';
import { CustomFieldService } from '~/services/CustomFieldService';
import type {
  CreateCustomFieldRequest,
  CustomFieldCatalogue,
  CustomFieldDefinition,
  CustomFieldHost,
} from '~/types/custom-fields';

/**
 * The custom-fields configuration screen's state.
 *
 * ## It does not fetch when it is called
 *
 * The catalogue loads from an explicit `load()`, called from `onMounted` —
 * never as a side effect of the composable being invoked. That rule is
 * written down in `useAuth.ts` and `usePermissions.ts` because breaking it
 * once froze the panel with "Maximum recursive updates exceeded": a composable
 * that mutates state at call time, called from anything on the render path,
 * re-triggers the render that called it.
 *
 * Custom fields are the highest-risk caller of that rule in the app, because a
 * field cell renders once per row per field.
 *
 * ## It is not the read path
 *
 * Values never come through here. Every entity endpoint already ships its own
 * `custom_fields` context beside its data, so a screen that shows records
 * needs no second request and this composable is not on its path at all.
 */
export const useCustomFields = () => {
  // Constructed here rather than at module scope — the service's ApiClient
  // reaches getApiConfig() -> useRuntimeConfig(), which needs a live Nuxt
  // context, unavailable at import time.
  const service = new CustomFieldService();
  const notification = useNotification();

  // Shared, because the configuration screen and any future field picker must
  // not disagree about which fields exist.
  const catalogue = useState<CustomFieldCatalogue | null>('customFieldCatalogue', () => null);

  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);
  /** Set when the workspace does not have custom fields enabled at all. */
  const disabled = ref(false);

  const load = async (force = false): Promise<void> => {
    if (catalogue.value && !force) return;

    loading.value = true;
    error.value = null;

    try {
      catalogue.value = await service.getCatalogue();
      disabled.value = false;
    } catch (e: any) {
      // The backend answers a switched-off feature with a machine-readable
      // code rather than an empty list, so the screen can say "not enabled"
      // instead of "no fields" — the difference between an explanation and a
      // lie, and the lesson features.ai_agent cost three days.
      if (e?.response?.data?.error === 'feature_disabled') {
        disabled.value = true;
        catalogue.value = null;
      } else {
        error.value = e?.message ?? 'Could not load the custom fields.';
      }
    } finally {
      loading.value = false;
    }
  };

  const definitions = computed<CustomFieldDefinition[]>(() => catalogue.value?.definitions ?? []);
  const hosts = computed<CustomFieldHost[]>(() => catalogue.value?.hosts ?? []);
  const roles = computed(() => catalogue.value?.roles ?? []);
  // The tenant's offered languages, defaulting to the one the panel is
  // rendering in rather than to an empty list — a dialog with no tab to draw
  // renders a form nobody can fill.
  const locales = computed(() => catalogue.value?.locales?.enabled ?? []);
  const defaultLocale = computed(() => catalogue.value?.locales?.default ?? locales.value[0] ?? 'en');
  const types = computed(() => catalogue.value?.types ?? []);

  const definitionsFor = (host: string) =>
    definitions.value.filter(definition => definition.host === host);

  /**
   * Fields still waiting for their column.
   *
   * The screen polls while any exist. `pending` is a real state rather than a
   * spinner: the column is created by a queued job, so a stopped worker means
   * it stays pending — and the screen must be able to say so.
   */
  const pending = computed(() => definitions.value.filter(d => d.state === 'pending'));

  const failed = computed(() => definitions.value.filter(d => d.state === 'failed'));

  const create = async (payload: CreateCustomFieldRequest): Promise<boolean> => {
    saving.value = true;
    error.value = null;

    try {
      await service.create(payload);
      await load(true);

      return true;
    } catch (e: any) {
      error.value = e?.message ?? 'Could not create the field.';

      // A 422 belongs ON the fields, not in a snackbar above everything: the
      // server said which input is wrong and repeating it as one flat sentence
      // throws that away. Rethrown so the dialog can place it; anything else
      // is a failure the person cannot fix by editing a field, so it is
      // announced.
      if (e instanceof ApiError && Object.keys(e.errors).length > 0) {
        throw e;
      }

      notification.error(error.value as string);

      return false;
    } finally {
      saving.value = false;
    }
  };

  const reconcile = async (host: string): Promise<void> => {
    try {
      await service.reconcile(host);
      await load(true);
    } catch (e: any) {
      notification.error(e?.message ?? 'Could not queue the reconcile.');
    }
  };

  return {
    catalogue,
    definitions,
    definitionsFor,
    hosts,
    roles,
    locales,
    defaultLocale,
    types,
    pending,
    failed,
    loading,
    saving,
    error,
    disabled,
    load,
    create,
    reconcile,
  };
};
