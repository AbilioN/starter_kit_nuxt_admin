<script setup lang="ts">
import CustomFieldValue from '~/components/CustomFields/CustomFieldValue.vue';
import type { AppointmentCard } from '~/types/agenda';
import type { CustomFieldDescriptor } from '~/types/custom-fields';

const props = defineProps<{
  card: AppointmentCard;
  selectable?: boolean;
  selected?: boolean;
  /**
   * The tenant's field descriptors, passed down from the screen rather than
   * fetched here. A card renders once per appointment per week, so a component
   * that loaded its own catalogue would be the single highest-frequency
   * caller in the app — exactly the shape that froze this panel once with
   * "Maximum recursive updates exceeded".
   */
  fields?: CustomFieldDescriptor[];
}>();

/**
 * Values joined to their descriptors. The server already decided which fields
 * this reader may see and formatted each value; nothing here interprets one.
 */
const customChips = computed(() => (props.card.custom ?? [])
  .map(value => ({ value, descriptor: (props.fields ?? []).find(f => f.field === value.field) }))
  .filter((pair): pair is { value: typeof pair.value; descriptor: CustomFieldDescriptor } => !!pair.descriptor));

const emit = defineEmits<{
  (e: 'toggle', id: string): void;
  (e: 'status', payload: { id: string; statusId: string }): void;
  (e: 'edit', id: string): void;
}>();

// 24-hour, and not only for brevity: "09:00 AM" wraps onto two lines in a
// column this narrow, which pushed the title out of the card entirely.
const time = computed(() => new Date(props.card.starts_at)
  .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));

/**
 * The whole menu, kept in its sub-menu groups. The server already decided which
 * actions apply to this appointment and which the viewer may use, so there is
 * nothing to filter here.
 */
const menuGroups = computed(() =>
  Object.entries(props.card.actions).map(([group, actions]) => ({ group, actions })));
</script>

<template>
  <v-card
    variant="flat"
    class="mb-2 agenda-card"
    :style="{ borderLeft: `4px solid ${card.type?.color ?? '#6B7280'}` }"
  >
    <div class="pa-2">
      <!--
        Controls on their own row so the title gets the card's full width.
        With the checkbox and the menu beside it, a seven-column week left
        roughly seventy pixels for the text and every title truncated to
        "Visita …", which tells a reader nothing.
      -->
      <div class="d-flex align-center ga-1 agenda-card__head">
        <v-checkbox-btn
          v-if="selectable"
          :model-value="selected"
          density="compact"
          hide-details
          class="flex-grow-0 pa-0 agenda-card__check"
          :disabled="!card.location.geocoded"
          @update:model-value="emit('toggle', card.id)"
        />

        <span class="text-caption font-weight-bold">{{ time }}</span>

        <!-- A bar that continues on another day says so, rather than appearing
             as a separate appointment on each. -->
        <v-icon v-if="card.spans_days" size="13" icon="mdi-arrow-expand-horizontal" />

        <!-- Says plainly that this stop cannot join a route yet, instead of
             letting someone select it and wonder why the route ignores it. -->
        <v-icon
          v-if="!card.location.geocoded"
          size="13" icon="mdi-map-marker-off-outline"
          class="text-medium-emphasis"
        />

        <v-spacer />

        <v-menu v-if="menuGroups.length">
          <template #activator="{ props: menu }">
            <v-btn
              v-bind="menu" icon="mdi-dots-vertical"
              size="x-small" variant="text" density="compact"
            />
          </template>

          <v-list density="compact" min-width="230">
            <template v-for="(g, gi) in menuGroups" :key="g.group">
              <v-divider v-if="gi > 0" />
              <v-list-subheader class="text-uppercase text-caption">{{ g.group }}</v-list-subheader>

              <template v-for="action in g.actions" :key="action.key">
                <!-- Status is a one-click change, so it opens its options
                     directly rather than a form. -->
                <v-menu v-if="action.key === 'status.change'" location="start">
                  <template #activator="{ props: sub }">
                    <v-list-item v-bind="sub" :title="action.label" append-icon="mdi-chevron-right" />
                  </template>
                  <v-list density="compact">
                    <v-list-item
                      v-for="option in action.options ?? []"
                      :key="option.id"
                      :title="option.label"
                      @click="emit('status', { id: card.id, statusId: option.id })"
                    >
                      <template #prepend>
                        <v-avatar :color="option.color" size="10" class="mr-2" />
                      </template>
                    </v-list-item>
                  </v-list>
                </v-menu>

                <v-list-item
                  v-else-if="action.kind === 'link'"
                  :title="action.label"
                  :href="action.href"
                  :target="action.target ?? '_blank'"
                  rel="noopener"
                />

                <v-list-item v-else :title="action.label" disabled />
              </template>
            </template>
          </v-list>
        </v-menu>
      </div>

      <!-- Two lines rather than one truncated one: "Visita — Clínica Boavista"
           is the whole point of the card, and half of it is not enough to tell
           two appointments apart. -->
      <!--
        The title opens the record. In a triage screen the cost of acting on a
        row should not be "find the menu" — the MADCRM study's own point about
        one-click editing, applied to the one action that needs a form.
      -->
      <div
        class="text-body-2 font-weight-medium agenda-card__title agenda-card__title--clickable"
        role="button"
        tabindex="0"
        @click="emit('edit', card.id)"
        @keydown.enter="emit('edit', card.id)"
      >{{ card.title }}</div>

      <div class="d-flex align-center ga-1 mt-1 flex-wrap">
        <v-chip
          v-if="card.status"
          size="x-small" variant="flat"
          :color="card.status.color"
          class="text-white"
        >
          {{ card.status.label }}
        </v-chip>

        <span v-if="card.location.city" class="text-caption text-medium-emphasis">
          {{ card.location.city }}
        </span>
      </div>

      <!--
        The tenant's own fields — the "supplements" the MADCRM agenda study
        describes ("extra fields a vertical adds — surface areas, product
        strips…"), and the reason appointments was the first host.

        Only fields the tenant placed in the card.badges slot arrive here; one
        with no slot belongs on the form rather than on every card of the week.
      -->
      <div v-if="customChips.length" class="d-flex flex-wrap mt-1">
        <CustomFieldValue
          v-for="chip in customChips"
          :key="chip.value.field"
          :descriptor="chip.descriptor"
          :value="chip.value"
        />
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.agenda-card {
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}
.agenda-card__head { min-height: 22px; }
.agenda-card__title--clickable { cursor: pointer; }
.agenda-card__title--clickable:hover { text-decoration: underline; }
.agenda-card__check { min-width: 24px; }

.agenda-card__title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.25;
  word-break: break-word;
}
</style>
