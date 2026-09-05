<script setup lang="ts">
import type { CustomFieldHost } from '~/types/custom-fields';

const props = defineProps<{ host: CustomFieldHost }>();

/**
 * What is left, drawn BEFORE anyone types.
 *
 * A tenant who discovers a limit by getting an error mid-save will not trust
 * the feature again — so both ceilings are on the screen from the start: the
 * plan's (how many fields this workspace paid for) and the structural one
 * (how many indexes InnoDB will give this table, which is the one that
 * actually binds).
 */
const planLimit = computed(() => props.host.budget.plan_limit);

const used = computed(() => props.host.budget.used);

const percentage = computed(() => {
  const limit = planLimit.value ?? props.host.budget.max_secondary_indexes;

  return limit > 0 ? Math.min(100, Math.round((used.value / limit) * 100)) : 0;
});

const colour = computed(() => (percentage.value >= 90 ? 'error' : percentage.value >= 70 ? 'warning' : 'primary'));
</script>

<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-1">
      <span class="text-caption text-medium-emphasis">
        {{ $t('pages.customFields.budget') }}
      </span>
      <span class="text-caption">
        {{ used }} / {{ planLimit ?? $t('pages.customFields.unlimited') }}
      </span>
    </div>

    <v-progress-linear :model-value="percentage" :color="colour" height="6" rounded />

    <span class="text-caption text-medium-emphasis">
      {{ $t('pages.customFields.indexBudget', { max: props.host.budget.max_secondary_indexes }) }}
    </span>
  </div>
</template>
