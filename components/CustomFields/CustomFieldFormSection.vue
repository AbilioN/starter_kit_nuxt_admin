<script setup lang="ts">
import CustomFieldControl from './CustomFieldControl.vue';
import type { CustomFieldDescriptor, CustomFieldValue } from '~/types/custom-fields';

const props = defineProps<{
  /** What the server said this reader may see. Sent once per response. */
  descriptors: CustomFieldDescriptor[];
  /** This record's values, joined to the descriptors by `field`. */
  values: CustomFieldValue[];
  /** Section keys to human names, from the host. */
  sections?: Record<string, string>;
  disabled?: boolean;
}>();

const emit = defineEmits<{ (e: 'update:draft', draft: Record<string, unknown>): void }>();

/**
 * The draft is owned HERE and never written back into any shared state.
 *
 * The panel has paid for the other arrangement twice: a child that adopted an
 * empty model before its async parent resolved silently persisted an empty
 * body, and a composable that mutated on call froze the app with "Maximum
 * recursive updates exceeded". A form fed by an async catalogue is exactly
 * that shape, so it re-adopts explicitly, from a watch, and only when the
 * inputs actually change.
 */
const draft = ref<Record<string, unknown>>({});

const adopt = () => {
  const next: Record<string, unknown> = {};

  for (const descriptor of props.descriptors) {
    const match = props.values.find(v => v.field === descriptor.field);
    next[descriptor.key] = match ? match.value : null;
  }

  draft.value = next;
};

// Both sources, because they arrive independently: the descriptors come with
// the screen and the values come with the record.
watch(() => [props.descriptors, props.values], adopt, { immediate: true, deep: true });

watch(draft, value => emit('update:draft', { ...value }), { deep: true });

/**
 * Grouped the way the tenant asked, ordered the way the tenant asked.
 *
 * Ordering by row id is the trap the source study names, and it springs the
 * first time somebody inserts a field in the middle — so `position` is
 * explicit and this sorts by it.
 */
const grouped = computed(() => {
  const byKey = new Map<string, CustomFieldDescriptor[]>();

  for (const descriptor of [...props.descriptors].sort((a, b) => a.position - b.position || a.field - b.field)) {
    const key = descriptor.section ?? '';
    byKey.set(key, [...(byKey.get(key) ?? []), descriptor]);
  }

  return [...byKey.entries()].map(([key, fields]) => ({
    key,
    // The server sends the host's own name for the section on every
    // descriptor. `sections` is the override for a screen that already holds
    // the map; the raw key is the last resort and should not normally show.
    title: key ? (props.sections?.[key] ?? fields[0]?.section_label ?? key) : null,
    fields,
  }));
});

const setValue = (key: string, value: unknown) => {
  draft.value = { ...draft.value, [key]: value };
};

/** The whole draft, for a parent about to submit. */
defineExpose({ draft, reset: adopt });
</script>

<template>
  <div v-if="props.descriptors.length">
    <div v-for="group in grouped" :key="group.key" class="mb-2">
      <div v-if="group.title" class="text-subtitle-2 text-medium-emphasis mt-3 mb-1">
        {{ group.title }}
      </div>

      <CustomFieldControl
        v-for="descriptor in group.fields"
        :key="descriptor.field"
        :descriptor="props.disabled ? { ...descriptor, editable: false } : descriptor"
        :model-value="draft[descriptor.key]"
        @update:model-value="setValue(descriptor.key, $event)"
      />
    </div>
  </div>
</template>
