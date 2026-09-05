<script setup lang="ts">
import type { CustomFieldDefinition } from '~/types/custom-fields';

const props = defineProps<{ definition: CustomFieldDefinition }>();

const { t, te } = useI18n();

/**
 * `pending` is a STATE, not a spinner.
 *
 * MySQL commits implicitly on DDL, so a field's row and its column cannot be
 * created in one atomic act — the column is made by a queued job. If Horizon
 * is down, `pending` is where the field stays, and the screen has to be able
 * to say that rather than spin for ever.
 */
const meta = computed(() => {
  switch (props.definition.state) {
    case 'live': return { colour: 'success', icon: 'mdi-check-circle-outline' };
    case 'pending': return { colour: 'warning', icon: 'mdi-clock-outline' };
    case 'failed': return { colour: 'error', icon: 'mdi-alert-circle-outline' };
    case 'missing': return { colour: 'error', icon: 'mdi-help-circle-outline' };
    case 'retiring':
    case 'retired':
    case 'purged': return { colour: 'grey', icon: 'mdi-archive-outline' };
    default: return { colour: 'grey', icon: 'mdi-help-circle-outline' };
  }
});

/**
 * The backend sends a machine CODE plus parameters, never a sentence.
 *
 * The sentence would be produced inside a queued job, whose locale is whoever
 * dispatched it, and would then land untranslated on an otherwise translated
 * screen. Translating here also means the same failure reads the same way for
 * every admin in the workspace.
 */
const reason = computed(() => {
  const error = props.definition.state_error;
  if (!error) return null;

  const key = `pages.customFields.errors.${error.code}`;

  return te(key) ? t(key, error.params as Record<string, unknown>) : error.code;
});
</script>

<template>
  <div class="d-inline-flex flex-column">
    <v-chip :color="meta.colour" size="small" variant="tonal">
      <v-icon :icon="meta.icon" size="14" class="mr-1" />
      {{ $t(`pages.customFields.state.${props.definition.state}`) }}
    </v-chip>

    <!-- Shown verbatim, next to the field it is about. A failure the tenant
         can read is a support ticket that does not happen. -->
    <span v-if="reason" class="text-caption text-error mt-1">{{ reason }}</span>
  </div>
</template>
