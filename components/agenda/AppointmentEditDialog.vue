<script setup lang="ts">
import CustomFieldFormSection from '~/components/CustomFields/CustomFieldFormSection.vue';
import type { CustomFieldDescriptor, CustomFieldValue } from '~/types/custom-fields';

const props = defineProps<{
  modelValue: boolean;
  appointmentId: string | null;
  /** Sent once with the agenda, already filtered to what this reader may see. */
  descriptors: CustomFieldDescriptor[];
  values: CustomFieldValue[];
  loading: boolean;
  saving: boolean;
  /** Section keys to human names, when the screen knows them. */
  sections?: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', open: boolean): void;
  (e: 'submit', payload: { title: string; custom: Record<string, unknown> }): void;
}>();

const { state: impersonation } = useImpersonation();

/**
 * A GodAdmin support session reads everything and writes nothing —
 * ImpersonationGuard refuses every non-GET on the api group without
 * `impersonation:write`. Discovering that as a 403 after typing a form is a
 * poor way to find out.
 */
const canWrite = computed(() => !impersonation.value.active || impersonation.value.can_write === true);

const title = ref('');
const customDraft = ref<Record<string, unknown>>({});

/**
 * Adopted when the dialog OPENS, and from the parent's own signal.
 *
 * Never on construction: the descriptors and the values arrive from two
 * different async sources, and a child that adopts an empty model before its
 * parent resolves is how this panel once silently persisted an empty body.
 */
watch(() => props.modelValue, open => {
  if (!open) return;
  customDraft.value = {};
});

/** The title comes from the card the parent already has. */
const setTitle = (value: string) => { title.value = value; };

defineExpose({ setTitle });

const submit = () => emit('submit', { title: title.value, custom: customDraft.value });
</script>

<template>
  <v-dialog
    :model-value="props.modelValue"
    max-width="640"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ $t('agenda.editAppointment') }}</v-card-title>

      <v-card-text>
        <v-alert v-if="!canWrite" type="info" variant="tonal" density="compact" class="mb-4">
          {{ $t('pages.customFields.readOnlySession') }}
        </v-alert>

        <div v-if="props.loading" class="d-flex justify-center py-6">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <template v-else>
          <v-text-field
            v-model="title"
            :label="$t('agenda.title')"
            variant="outlined"
            density="comfortable"
            maxlength="255"
          />

          <!--
            The tenant's own fields. The descriptors came with the agenda and
            the values came with this record's read, so there is nothing to
            fetch here and no rule to re-implement: a field this admin may not
            see is not in the list at all, and one they may not edit arrives
            with editable: false.
          -->
          <CustomFieldFormSection
            :descriptors="props.descriptors"
            :values="props.values"
            :sections="props.sections"
            :disabled="!canWrite"
            @update:draft="customDraft = $event"
          />

          <p v-if="!props.descriptors.length" class="text-caption text-medium-emphasis mt-2">
            {{ $t('agenda.noCustomFields') }}
          </p>
        </template>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">
          {{ $t('common.actions.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :loading="props.saving"
          :disabled="props.loading || !canWrite"
          @click="submit"
        >
          {{ $t('common.actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
