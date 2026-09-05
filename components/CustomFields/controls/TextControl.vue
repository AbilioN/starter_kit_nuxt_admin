<script setup lang="ts">
import type { CustomFieldDescriptor } from '~/types/custom-fields';

const props = defineProps<{
  descriptor: CustomFieldDescriptor;
  modelValue: unknown;
}>();

const emit = defineEmits<{ (e: 'update:modelValue', value: string | null): void }>();

/**
 * 190 characters, because a filterable text field is stored as VARCHAR(190)
 * and MySQL runs in strict mode — a 191st character is error 1406, not a
 * truncation. Saying so here means the person editing finds out while typing
 * rather than on save.
 */
const MAX = 190;
</script>

<template>
  <v-text-field
    :model-value="(props.modelValue as string) ?? ''"
    :label="props.descriptor.label"
    :hint="props.descriptor.help_text ?? undefined"
    :persistent-hint="!!props.descriptor.help_text"
    :prepend-inner-icon="props.descriptor.icon ?? undefined"
    :readonly="!props.descriptor.editable"
    :counter="MAX"
    :maxlength="MAX"
    variant="outlined"
    density="comfortable"
    @update:model-value="emit('update:modelValue', $event === '' ? null : $event)"
  />
</template>
