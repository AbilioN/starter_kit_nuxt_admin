<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
// Imported explicitly rather than relying on Nuxt's auto-import, which derives
// the name from the DIRECTORY path — components/CustomFields/FieldStateChip.vue
// resolves as `CustomFieldsFieldStateChip`, not `FieldStateChip`. A name that
// does not resolve renders nothing at all: no error, no failed build, just an
// empty cell. `nuxt build` is this panel's only CI gate and it passed with all
// three of these silently missing.
import FieldBudgetMeter from '~/components/CustomFields/FieldBudgetMeter.vue';
import FieldDefinitionDialog from '~/components/CustomFields/FieldDefinitionDialog.vue';
import FieldStateChip from '~/components/CustomFields/FieldStateChip.vue';
import { ApiError } from '~/infrastructure/http/ApiClient';
import type { CreateCustomFieldRequest, CustomFieldHost } from '~/types/custom-fields';

definePageMeta({
  middleware: ['auth', 'permissions'],
});

const { t, te } = useI18n();
const { hasPermission } = usePermissions();
const notification = useNotification();

const {
  definitions,
  definitionsFor,
  hosts,
  roles,
  locales,
  defaultLocale,
  types,
  pending,
  loading,
  saving,
  error,
  disabled,
  load,
  create,
  reconcile,
} = useCustomFields();

const dialog = ref(false);
const dialogRef = ref<{ setFieldErrors: (errors: Record<string, string[]>) => void } | null>(null);
const activeHost = ref<CustomFieldHost | null>(null);

/**
 * Which entities to show.
 *
 * One stacked card per host does not survive the host list growing — and it is
 * meant to grow: adding a host is a class and a registration line, and
 * tenant-defined child entities will each be one. So the entities are chosen
 * first and the tables follow, rather than the screen getting longer every
 * time the product gains a noun.
 */
const SELECTION_KEY = 'customFields.visibleHosts';

const selectedHostKeys = ref<string[]>([]);

/** Per-viewer convenience, so the choice survives a reload. */
const readStoredSelection = (): string[] | null => {
  if (!process.client) return null;

  try {
    const raw = localStorage.getItem(SELECTION_KEY);

    return raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    // A cleared or blocked store is not a reason to fail the screen.
    return null;
  }
};

const writeStoredSelection = (keys: string[]) => {
  if (!process.client) return;

  try {
    localStorage.setItem(SELECTION_KEY, JSON.stringify(keys));
  } catch {
    // Same: the preference is a nicety, never a dependency.
  }
};

/**
 * Applied once the catalogue lands, because the default depends on which hosts
 * this build actually registered.
 */
const initialiseSelection = () => {
  const available = hosts.value.map(host => host.key);

  if (available.length === 0) return;

  // A stored key for a host that no longer exists is dropped rather than
  // shown as an empty section.
  const stored = (readStoredSelection() ?? []).filter(key => available.includes(key));

  if (stored.length > 0) {
    selectedHostKeys.value = stored;

    return;
  }

  selectedHostKeys.value = available.includes('users') ? ['users'] : [available[0]];
};

watch(hosts, initialiseSelection, { immediate: true });
watch(selectedHostKeys, keys => writeStoredSelection(keys));

const visibleHosts = computed(() => hosts.value.filter(host => selectedHostKeys.value.includes(host.key)));

const hostOptions = computed(() => hosts.value.map(host => ({
  value: host.key,
  title: te(`pages.customFields.hosts.${host.key}`)
    ? t(`pages.customFields.hosts.${host.key}`)
    : host.key,
  count: definitionsFor(host.key).length,
})));

// Explicit, from onMounted — never as a side effect of useCustomFields() being
// called. See the composable's docblock: a call-time fetch on the render path
// is what froze this panel once with "Maximum recursive updates exceeded".
onMounted(() => load());

/**
 * A pending field is waiting on a queued job, so the screen refreshes while
 * any exist rather than asking the person to reload.
 *
 * Deliberately slow and deliberately bounded: this is not a progress bar, and
 * if the worker is down the field stays pending — which the state chip says
 * out loud instead of spinning for ever.
 */
let poll: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  poll = setInterval(() => {
    if (pending.value.length > 0 && !loading.value) load(true);
  }, 4000);
});

onUnmounted(() => {
  if (poll) clearInterval(poll);
});

const openDialog = (host: CustomFieldHost) => {
  activeHost.value = host;
  dialog.value = true;
};

const submit = async (payload: CreateCustomFieldRequest) => {
  try {
    const created = await create(payload);

    if (created) {
      dialog.value = false;
      // 202: the row exists, the column does not yet. Saying "queued" rather
      // than "saved" is the honest word for what happened.
      notification.success(t('pages.customFields.queued'));
    }
  } catch (e) {
    // The per-field map the server sent, put back on the fields it belongs to.
    if (e instanceof ApiError) dialogRef.value?.setFieldErrors(e.errors);
  }
};

const localeLabel = (labels: Record<string, { label: string }>) => {
  // The tenant's default, not simply the first offered language — the two
  // differ as soon as somebody reorders the list.
  const preferred = labels[defaultLocale.value] ?? labels[locales.value[0]] ?? Object.values(labels)[0];

  return preferred?.label ?? '—';
};
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h3 class="text-h4">{{ $t('pages.customFields.title') }}</h3>
        <p class="text-subtitle-2 text-medium-emphasis mb-0">
          {{ $t('pages.customFields.subtitle') }}
        </p>
      </div>
    </div>

    <v-alert v-if="!hasPermission('custom-field-read')" type="warning" variant="tonal">
      {{ $t('common.noPermission') }}
    </v-alert>

    <template v-else>
      <!-- A switched-off feature SAYS so. The backend answers a machine code
           rather than an empty list precisely so this is not mistaken for
           "no fields yet" — the lesson features.ai_agent cost three days. -->
      <v-alert v-if="disabled" type="info" variant="tonal">
        {{ $t('pages.customFields.featureDisabled') }}
      </v-alert>

      <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
        {{ error }}
      </v-alert>

      <div v-if="loading && definitions.length === 0" class="d-flex justify-center py-10">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <template v-else-if="!disabled">
        <!--
          Entities are chosen first, tables follow. One stacked card per host
          does not survive the host list growing, and it is meant to grow —
          adding one is a class and a registration line.
        -->
        <v-card variant="flat" class="mb-6 pa-4">
          <v-select
            v-model="selectedHostKeys"
            :items="hostOptions"
            :label="$t('pages.customFields.showEntities')"
            multiple
            chips
            closable-chips
            variant="outlined"
            density="comfortable"
            hide-details
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" :title="undefined">
                <template #prepend>
                  <!--
                    An explicit tick rather than a checkbox: the question is
                    "which of these am I looking at", and a tick reads as an
                    answer where an empty checkbox reads as a chore.
                  -->
                  <v-icon
                    :icon="selectedHostKeys.includes(item.value) ? 'mdi-check-circle' : 'mdi-circle-outline'"
                    :color="selectedHostKeys.includes(item.value) ? 'primary' : 'grey'"
                    size="20"
                    class="mr-3"
                  />
                </template>

                <v-list-item-title>{{ item.title }}</v-list-item-title>
                <template #append>
                  <span class="text-caption text-medium-emphasis">
                    {{ $t('pages.customFields.fieldCount', { count: item.raw.count }) }}
                  </span>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-card>

        <v-alert v-if="!visibleHosts.length" type="info" variant="tonal">
          {{ $t('pages.customFields.noneSelected') }}
        </v-alert>

        <UiChildCard v-for="host in visibleHosts" :key="host.key" :title="$t(`pages.customFields.hosts.${host.key}`)" class="mb-6">
          <div class="d-flex align-center justify-space-between mb-4 ga-6">
            <div style="max-width: 320px; flex: 1;">
              <FieldBudgetMeter :host="host" />
            </div>

            <div class="d-flex ga-2">
              <v-btn
                v-if="hasPermission('custom-field-manage')"
                variant="text"
                size="small"
                prepend-icon="mdi-refresh"
                @click="reconcile(host.key)"
              >
                {{ $t('pages.customFields.reconcile') }}
              </v-btn>

              <v-btn
                v-if="hasPermission('custom-field-manage')"
                color="primary"
                prepend-icon="mdi-plus"
                @click="openDialog(host)"
              >
                {{ $t('pages.customFields.newField') }}
              </v-btn>
            </div>
          </div>

          <v-table density="comfortable">
            <thead>
              <tr>
                <th>{{ $t('pages.customFields.label') }}</th>
                <th>{{ $t('pages.customFields.fieldType') }}</th>
                <th>{{ $t('pages.customFields.storage') }}</th>
                <th>{{ $t('pages.customFields.slot') }}</th>
                <th>{{ $t('pages.customFields.status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="definition in definitionsFor(host.key)" :key="definition.id">
                <td>
                  <div class="d-flex align-center">
                    <v-icon
                      v-if="definition.icon"
                      :icon="definition.icon"
                      size="16"
                      class="mr-2"
                      :style="definition.colour ? { color: definition.colour } : {}"
                    />
                    {{ localeLabel(definition.labels) }}
                  </div>
                  <!-- Every language the tenant has written this field in. -->
                  <span class="text-caption text-medium-emphasis">
                    {{ Object.keys(definition.labels).join(' · ').toUpperCase() }}
                  </span>
                </td>

                <td>{{ $t(`pages.customFields.types.${definition.field_type}`) }}</td>

                <td>
                  <!--
                    The decision the study calls the first pitfall, made
                    visible: a filterable field is an indexed VARCHAR and costs
                    row budget; a display-only one is TEXT and costs almost
                    nothing. Same type to the tenant, different column
                    underneath.
                  -->
                  <v-chip size="x-small" :color="definition.is_filterable ? 'primary' : 'grey'" variant="tonal">
                    {{ definition.is_filterable
                      ? $t('pages.customFields.storageIndexed')
                      : $t('pages.customFields.storageDisplayOnly') }}
                  </v-chip>
                  <div class="text-caption text-medium-emphasis">{{ definition.key }}</div>
                </td>

                <td>
                  <span v-if="definition.slot">{{ host.slots[definition.slot] ?? definition.slot }}</span>
                  <span v-else class="text-medium-emphasis">{{ $t('pages.customFields.formOnly') }}</span>
                </td>

                <td><FieldStateChip :definition="definition" /></td>
              </tr>

              <tr v-if="definitionsFor(host.key).length === 0">
                <td colspan="5" class="text-center text-medium-emphasis py-6">
                  {{ $t('pages.customFields.empty') }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </UiChildCard>
      </template>
    </template>

    <FieldDefinitionDialog
      v-if="activeHost"
      ref="dialogRef"
      v-model="dialog"
      :host="activeHost"
      :types="types"
      :roles="roles"
      :locales="locales"
      :default-locale="defaultLocale"
      :saving="saving"
      @submit="submit"
    />
  </div>
</template>
