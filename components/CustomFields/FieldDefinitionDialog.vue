<script setup lang="ts">
import type {
  CreateCustomFieldRequest,
  CustomFieldHost,
  CustomFieldRoleOption,
  CustomFieldTypeOption,
} from '~/types/custom-fields';

const props = defineProps<{
  modelValue: boolean;
  host: CustomFieldHost;
  types: CustomFieldTypeOption[];
  roles: CustomFieldRoleOption[];
  locales: string[];
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', open: boolean): void;
  (e: 'submit', payload: CreateCustomFieldRequest): void;
}>();

const { state: impersonation } = useImpersonation();

/**
 * A GodAdmin support session may read everything and write nothing —
 * ImpersonationGuard refuses every non-GET on the api group unless the token
 * carries `impersonation:write`. No screen in this panel gates a write on that
 * today, and a screen whose save runs DDL against the tenant's own database is
 * the worst place to discover it as a 403.
 */
const canWrite = computed(() => !impersonation.value.active || impersonation.value.can_write === true);

/**
 * The draft is owned HERE, in local refs, and never written back into the
 * composable's shared state.
 *
 * The panel has already paid for the other arrangement twice: a child that
 * adopts an empty model before its async parent resolves silently persisted an
 * empty body once, and a composable that mutates on call froze the app with
 * "Maximum recursive updates exceeded".
 */
const fieldType = ref<string>('text');
const isFilterable = ref(false);
const slot = ref<string | null>(null);
const section = ref<string | null>(null);
const icon = ref<string | null>(null);
const colour = ref<string | null>(null);
const colourDark = ref<string | null>(null);
const isRequired = ref(false);

/**
 * One entry per language, so a tab can be empty without being an error.
 *
 * Seeded at SETUP, not only from the watch below. The dialog is mounted with
 * `v-if` and opened in the same tick, so `modelValue` is already true on its
 * first render — a watch without `immediate` does not fire for that open, and
 * the window items rendered `labels[locale].label` against an empty object.
 * That threw "Cannot read properties of undefined" on every open and the whole
 * language section rendered as nothing.
 */
const blankLabels = (locales: string[]) =>
  Object.fromEntries(locales.map(l => [l, { label: '', help_text: '' }]));

const labels = ref<Record<string, { label: string; help_text: string }>>(blankLabels(props.locales));
const activeLocale = ref<string>(props.locales[0] ?? '');

const roleRules = ref<Record<'hidden' | 'readonly' | 'required', string[]>>({
  hidden: [],
  readonly: [],
  required: [],
});

/** Per-field errors from the server's 422, keyed the way Laravel sends them. */
const fieldErrors = ref<Record<string, string[]>>({});

const selectedType = computed(() => props.types.find(t => t.key === fieldType.value));

const slotOptions = computed(() => Object.entries(props.host.slots)
  .map(([value, title]) => ({ value, title })));

const sectionOptions = computed(() => Object.entries(props.host.sections)
  .map(([value, title]) => ({ value, title })));

const reset = () => {
  fieldType.value = 'text';
  isFilterable.value = false;
  slot.value = null;
  section.value = null;
  icon.value = null;
  colour.value = null;
  colourDark.value = null;
  isRequired.value = false;
  roleRules.value = { hidden: [], readonly: [], required: [] };
  fieldErrors.value = {};

  labels.value = blankLabels(props.locales);
  activeLocale.value = props.locales[0] ?? '';
};

// `immediate` because the dialog is mounted already open; without it the first
// open renders against whatever setup left behind.
watch(() => props.modelValue, open => { if (open) reset(); }, { immediate: true });

// The locales arrive with the catalogue, which may resolve after this mounts.
watch(() => props.locales, () => { if (props.modelValue) reset(); }, { deep: true });

/**
 * A field needs a name in at least one language; the rest of the tabs may stay
 * empty. That mirrors the send-time cascade the backend already runs for
 * templates: what a tenant OFFERS is never the same as what has been written,
 * and sending the language that exists beats sending nothing.
 */
const namedLocales = computed(() => Object.entries(labels.value)
  .filter(([, text]) => text.label.trim() !== ''));

const canSubmit = computed(() => namedLocales.value.length > 0 && !props.saving && canWrite.value);

const submit = () => {
  emit('submit', {
    host: props.host.key,
    field_type: fieldType.value as CreateCustomFieldRequest['field_type'],
    is_filterable: isFilterable.value,
    slot: slot.value,
    section: section.value,
    icon: icon.value,
    colour: colour.value,
    colour_dark: colourDark.value,
    is_required: isRequired.value,
    labels: Object.fromEntries(namedLocales.value.map(([locale, text]) => [
      locale,
      { label: text.label.trim(), help_text: text.help_text.trim() || null },
    ])),
    role_rules: {
      hidden: roleRules.value.hidden,
      readonly: roleRules.value.readonly,
      required: roleRules.value.required,
    },
  });
};

defineExpose({ setFieldErrors: (errors: Record<string, string[]>) => { fieldErrors.value = errors; } });
</script>

<template>
  <v-dialog
    :model-value="props.modelValue"
    max-width="720"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ $t('pages.customFields.newField') }}</v-card-title>

      <v-card-text>
        <!--
          A support session may read everything and write nothing. No screen in
          this panel gates a write on that today, and a screen whose save runs
          DDL against the tenant's own database is the worst place to find out.
        -->
        <v-alert v-if="!canWrite" type="info" variant="tonal" density="compact" class="mb-4">
          {{ $t('pages.customFields.readOnlySession') }}
        </v-alert>

        <v-row dense>
          <v-col cols="12" md="6">
            <v-select
              v-model="fieldType"
              :items="props.types.map(t => ({ value: t.key, title: $t(`pages.customFields.types.${t.key}`) }))"
              :label="$t('pages.customFields.fieldType')"
              :error-messages="fieldErrors.field_type"
              variant="outlined"
              density="comfortable"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-switch
              v-model="isFilterable"
              :disabled="!selectedType?.can_filter"
              :label="$t('pages.customFields.filterable')"
              :error-messages="fieldErrors.is_filterable"
              color="primary"
              density="compact"
              hide-details
            />
            <!--
              Not a display toggle. This is what decides whether the column is
              an indexed VARCHAR or an off-page TEXT, and it cannot be changed
              afterwards without rewriting the table.
            -->
            <span class="text-caption text-medium-emphasis">
              {{ $t('pages.customFields.filterableHint') }}
            </span>
          </v-col>
        </v-row>

        <!-- One tab per language the platform supports. An empty tab is an
             affordance, not an error — the same rule the template editor's
             locale tabs already follow. -->
        <v-tabs v-model="activeLocale" density="compact" class="mt-4">
          <v-tab v-for="locale in props.locales" :key="locale" :value="locale">
            {{ locale.toUpperCase() }}
            <v-icon v-if="labels[locale]?.label" icon="mdi-check" size="12" class="ml-1" />
          </v-tab>
        </v-tabs>

        <v-window v-model="activeLocale" class="mt-3">
          <v-window-item v-for="locale in props.locales" :key="locale" :value="locale">
            <v-text-field
              v-if="labels[locale]"
              v-model="labels[locale].label"
              :label="$t('pages.customFields.label')"
              :error-messages="fieldErrors[`labels.${locale}.label`]"
              maxlength="120"
              counter
              variant="outlined"
              density="comfortable"
            />
            <v-text-field
              v-if="labels[locale]"
              v-model="labels[locale].help_text"
              :label="$t('pages.customFields.helpText')"
              maxlength="255"
              variant="outlined"
              density="comfortable"
            />
          </v-window-item>
        </v-window>

        <v-row dense class="mt-2">
          <v-col cols="12" md="6">
            <v-select
              v-model="slot"
              :items="slotOptions"
              :label="$t('pages.customFields.slot')"
              :error-messages="fieldErrors.slot"
              clearable
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="section"
              :items="sectionOptions"
              :label="$t('pages.customFields.section')"
              :error-messages="fieldErrors.section"
              clearable
              variant="outlined"
              density="comfortable"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="icon"
              :label="$t('pages.customFields.icon')"
              placeholder="mdi-file-document"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="colour"
              :label="$t('pages.customFields.colour')"
              :error-messages="fieldErrors.colour"
              placeholder="#185FA5"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="4">
            <!-- Both colours are stored, because the server does not know
                 whether the reader is in light or dark mode. -->
            <v-text-field
              v-model="colourDark"
              :label="$t('pages.customFields.colourDark')"
              :error-messages="fieldErrors.colour_dark"
              placeholder="#7EB6E8"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>

        <v-divider class="my-3" />

        <!--
          Sets of roles, not a threshold. This product's roles are flat — no
          rank, no ordering — and an admin holds several at once, so "hidden
          for everyone below X" has nothing to compare against.

          Resolution is deny-wins: holding one role that hides the field hides
          it, whatever else the person holds.
        -->
        <div class="text-subtitle-2 mb-2">{{ $t('pages.customFields.roleRules') }}</div>

        <v-row dense>
          <v-col v-for="rule in (['hidden', 'readonly', 'required'] as const)" :key="rule" cols="12" md="4">
            <v-select
              v-model="roleRules[rule]"
              :items="props.roles.map(r => ({ value: r.id, title: r.name }))"
              :label="$t(`pages.customFields.rules.${rule}`)"
              multiple
              chips
              closable-chips
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">
          {{ $t('common.actions.cancel') }}
        </v-btn>
        <v-btn color="primary" :loading="props.saving" :disabled="!canSubmit" @click="submit">
          {{ $t('common.actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
