<script setup lang="ts">
import type { CustomFieldDescriptor, CustomFieldValue } from '~/types/custom-fields';

const props = defineProps<{
  descriptor: CustomFieldDescriptor;
  value: CustomFieldValue;
}>();

/**
 * The chip a card shows.
 *
 * It draws `text` — the value the server already formatted — and never
 * interprets `value`. The backend emits values rather than markup precisely so
 * that this component, a mobile client and a CSV export can each draw the same
 * data their own way.
 *
 * `colour` only, not `colour_dark`. The API sends both because the server does
 * not know what the reader is looking at, but this panel registers a single
 * light Vuetify theme and `useTenantTheme` mutates it in place — introducing a
 * second theme changes how every existing screen renders, so it is its own
 * piece of work rather than a clause in this one.
 */
const style = computed(() => (props.descriptor.colour
  ? { borderColor: props.descriptor.colour, color: props.descriptor.colour }
  : {}));
</script>

<template>
  <v-chip
    v-if="props.value.text"
    size="x-small"
    variant="outlined"
    class="mr-1 mb-1 custom-field-chip"
    :style="style"
    :title="`${props.descriptor.label}: ${props.value.text}`"
  >
    <v-icon v-if="props.descriptor.icon" :icon="props.descriptor.icon" size="12" class="mr-1" />
    <span class="custom-field-chip__text">{{ props.value.text }}</span>
  </v-chip>
</template>

<style scoped>
/*
 * A card is around 150px wide in a seven-day week and a tenant's field can hold
 * 190 characters, so the chip has to be told to give up — the first render
 * against real data ran straight past the card's border.
 *
 * `max-width` on the chip alone is not enough: Vuetify's inner
 * `.v-chip__content` is a flex container that does not shrink, so the text
 * pushes it wider than its parent. It needs `min-width: 0` (the flex item's
 * default `min-width: auto` is what refuses to shrink) plus the overflow rule.
 *
 * The full value stays reachable: the title attribute carries
 * "label: value" — which is also how someone finds out WHICH field a truncated
 * chip belongs to.
 */
.custom-field-chip {
  max-width: 100%;
}

.custom-field-chip :deep(.v-chip__content) {
  min-width: 0;
  overflow: hidden;
}

.custom-field-chip__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
</style>
