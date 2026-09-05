<script setup lang="ts">
import TextControl from './controls/TextControl.vue';
import type { CustomFieldDescriptor, CustomFieldType } from '~/types/custom-fields';

const props = defineProps<{
  descriptor: CustomFieldDescriptor;
  modelValue: unknown;
}>();

const emit = defineEmits<{ (e: 'update:modelValue', value: unknown): void }>();

/**
 * Type -> control, from STATIC imports.
 *
 * Not a runtime string name: `<component is="TextControl">` would need the
 * component registered globally, and a name that does not resolve renders
 * nothing at all — silently, with no console error and no build failure. This
 * panel's only CI gate is `nuxt build`, which cannot see an empty box.
 *
 * The map is `Partial` on purpose, so the fallback arm below is reachable and
 * TypeScript knows it.
 */
const CONTROLS: Partial<Record<CustomFieldType, unknown>> = {
  text: TextControl,
};

const control = computed(() => CONTROLS[props.descriptor.type]);
</script>

<template>
  <component
    :is="control"
    v-if="control"
    :descriptor="props.descriptor"
    :model-value="props.modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  />

  <!--
    The exhaustive default arm, and it is VISIBLE.

    A type registered on the backend before this panel learned to draw it must
    say so on the screen. The alternative — rendering nothing — looks exactly
    like a field that was never created, and the person who defined it would
    reasonably conclude the save failed.
  -->
  <v-alert v-else type="warning" variant="tonal" density="compact" class="mb-2">
    {{ $t('pages.customFields.unsupportedType', { type: props.descriptor.type }) }}
  </v-alert>
</template>
