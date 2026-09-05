<script setup lang="ts">
import AppointmentCard from '~/components/agenda/AppointmentCard.vue';
// Explicit: Nuxt derives the auto-import name from the directory, so this
// would be `AgendaAppointmentEditDialog`. A name that does not resolve renders
// nothing at all, with no error and a passing build.
import AppointmentEditDialog from '~/components/agenda/AppointmentEditDialog.vue';
import { ApiError } from '~/infrastructure/http/ApiClient';
import type { AgendaGroupBy, AgendaView } from '~/types/agenda';

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();

const {
  saving, appointmentValues, fetchAppointment, saveAppointment,
  agenda, view, date, groupBy, loading, error, disabled,
  routableCards, load, setView, setGroupBy, setDate, shift, changeStatus,
} = useAgenda();

const {
  route, loading: routing, error: routeError, notIncluded,
  totalKm, totalMinutes, optimize, clear,
} = useRouteOptimizer();

const selected = ref<string[]>([]);
const routeOpen = ref(false);

onMounted(load);

const label = computed(() => {
  if (!agenda.value) return '';
  const from = new Date(agenda.value.from);

  if (view.value === 'day') {
    return from.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
  }
  if (view.value === 'month') {
    return from.toLocaleDateString([], { month: 'long', year: 'numeric' });
  }
  return `${t('agenda.week_of')} ${agenda.value.iso_week} · ${from.toLocaleDateString()}`;
});

const goToday = () => setDate(new Date().toISOString().slice(0, 10));

const toggle = (id: string) => {
  const at = selected.value.indexOf(id);
  at === -1 ? selected.value.push(id) : selected.value.splice(at, 1);
};

const notification = useNotification();

const editOpen = ref(false);
const editingId = ref<string | null>(null);
const editLoading = ref(false);
const editDialog = ref<{ setTitle: (v: string) => void } | null>(null);

/**
 * Opens the record. Fetched on OPEN, never on render — the agenda draws a
 * hundred cards and a fetch on the render path is the shape that froze this
 * panel once.
 */
const onEdit = async (id: string) => {
  editingId.value = id;
  editOpen.value = true;
  editLoading.value = true;

  try {
    const record = await fetchAppointment(id);
    editDialog.value?.setTitle(String((record as any)?.title ?? ''));
  } catch (e: any) {
    notification.error(e?.message ?? t('agenda.loadFailed'));
    editOpen.value = false;
  } finally {
    editLoading.value = false;
  }
};

const onEditSubmit = async (payload: { title: string; custom: Record<string, unknown> }) => {
  if (!editingId.value) return;

  try {
    const ignored = await saveAppointment(editingId.value, payload);

    if (ignored === null) {
      notification.error(error.value ?? t('agenda.saveFailed'));

      return;
    }

    if (ignored.length > 0) {
      // Dropped and reported, not refused: a form loaded before somebody
      // changed the per-role rules must still be submittable.
      notification.warning(t('pages.users.someFieldsIgnored', { count: ignored.length }));
    }

    editOpen.value = false;
  } catch (e: any) {
    // A 422 names its fields; there is nowhere on this small form to place
    // them per-input yet, so the message is shown whole rather than swallowed.
    notification.error(e instanceof ApiError ? e.message : (e?.message ?? t('agenda.saveFailed')));
  }
};

const onStatus = async ({ id, statusId }: { id: string; statusId: string }) => {
  await changeStatus(id, statusId);
};

/** A day in the month view drills into that day rather than expanding in place. */
const drillInto = async (day: string) => {
  await setDate(day);
  await setView('day');
};

const planRoute = async () => {
  routeOpen.value = true;
  await optimize({
    appointment_ids: selected.value,
    origin_appointment_id: selected.value[0],
    round_trip: true,
  });
};

const canPlanRoute = computed(() => selected.value.length >= 2);

const km = (metres: number) => (Math.round(metres / 100) / 10).toFixed(1);
const mins = (seconds: number) => Math.round(seconds / 60);

const legBefore = (stopId: string, index: number) => {
  if (!route.value || index === 0) return null;
  const previous = route.value.stops[index - 1];
  return route.value.legs.find(l => l.from === previous.id && l.to === stopId) ?? null;
};
</script>

<template>
  <div class="page-fill">
    <!-- A switched-off feature says so. Showing an empty grid instead would be
         indistinguishable from a quiet week, which is the wrong answer. -->
    <v-alert v-if="disabled" type="info" variant="tonal" class="mb-4">
      {{ t('agenda.disabled') }}
    </v-alert>

    <template v-else>
      <v-card variant="flat" class="mb-4">
        <v-card-text class="d-flex flex-wrap align-center ga-3">
          <v-btn-toggle :model-value="view" density="compact" mandatory
                        @update:model-value="(v: AgendaView) => setView(v)">
            <v-btn value="day" size="small">{{ t('agenda.day') }}</v-btn>
            <v-btn value="week" size="small">{{ t('agenda.week') }}</v-btn>
            <v-btn value="month" size="small">{{ t('agenda.month') }}</v-btn>
          </v-btn-toggle>

          <div class="d-flex align-center ga-1">
            <v-btn icon="mdi-chevron-left" size="small" variant="text" @click="shift(-1)" />
            <v-btn size="small" variant="text" @click="goToday">{{ t('agenda.today') }}</v-btn>
            <v-btn icon="mdi-chevron-right" size="small" variant="text" @click="shift(1)" />
          </div>

          <div class="text-subtitle-1 font-weight-medium text-capitalize">{{ label }}</div>

          <v-spacer />

          <v-select
            :model-value="groupBy"
            :items="[
              { title: t('agenda.none'), value: null },
              { title: t('agenda.byAssignee'), value: 'assigned_admin' },
              { title: t('agenda.byType'), value: 'type' },
              { title: t('agenda.byStatus'), value: 'status' },
              { title: t('agenda.byCity'), value: 'city' },
            ]"
            :label="t('agenda.groupBy')"
            density="compact" hide-details variant="outlined"
            style="max-width: 200px"
            @update:model-value="(v: AgendaGroupBy | null) => setGroupBy(v)"
          />

          <!-- Counts belong next to the axis they describe. The agenda doubles
               as the daily dashboard, which is why they are in the payload. -->
          <v-chip v-if="agenda" size="small" variant="tonal">
            {{ agenda.totals.count }} {{ t('agenda.appointments') }} ·
            {{ agenda.totals.confirmed }} {{ t('agenda.confirmed') }}
          </v-chip>

          <v-btn
            color="primary" size="small" prepend-icon="mdi-map-marker-path"
            :disabled="!canPlanRoute" :loading="routing" @click="planRoute"
          >
            {{ t('agenda.planRoute') }}
            <span v-if="selected.length" class="ml-1">({{ selected.length }})</span>
          </v-btn>
        </v-card-text>
      </v-card>

      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
      <v-progress-linear v-if="loading" indeterminate class="mb-2" />

      <div class="agenda-scroll">
      <div v-for="group in agenda?.groups ?? []" :key="group.key ?? 'all'" class="mb-6 agenda-group">
        <div v-if="group.label" class="d-flex align-center ga-2 mb-2">
          <span class="text-subtitle-2 font-weight-bold">{{ group.label }}</span>
          <v-chip size="x-small" variant="tonal">
            {{ group.totals.count }} · {{ group.totals.confirmed }} {{ t('agenda.confirmed') }}
          </v-chip>
        </div>

        <!-- WEEK / MONTH: columns of days -->
        <div v-if="group.days" class="agenda-grid" :class="{ 'agenda-grid--month': view === 'month' }">
          <div
            v-for="day in group.days" :key="day.date"
            class="agenda-col" :class="{ 'agenda-col--today': day.is_today,
                                          'agenda-col--clickable': view === 'month' }"
            @click="view === 'month' ? drillInto(day.date) : undefined"
          >
            <div class="agenda-col__head">
              <div class="text-caption font-weight-bold">
                {{ new Date(day.date).toLocaleDateString([], { weekday: 'short', day: 'numeric' }) }}
              </div>
              <div v-if="day.count" class="text-caption text-medium-emphasis">
                {{ day.count }} · {{ day.confirmed }} ✓
              </div>
            </div>

            <div class="agenda-col__body">
              <AppointmentCard
                v-for="card in day.appointments ?? []" :key="card.id"
                :card="card" selectable :selected="selected.includes(card.id)"
                :fields="agenda?.custom_fields"
                @toggle="toggle" @status="onStatus" @edit="onEdit"
              />
              <div v-if="!day.count" class="text-caption text-disabled pa-2">
                {{ t('agenda.empty') }}
              </div>
            </div>
          </div>
        </div>

        <!-- DAY: rows of hours, empty ones kept so the shape of the day is honest -->
        <div v-else-if="group.hours">
          <div v-for="hour in group.hours" :key="hour.hour" class="d-flex ga-3 mb-1">
            <div class="agenda-hour text-caption text-medium-emphasis">{{ hour.label }}</div>
            <div class="flex-grow-1">
              <AppointmentCard
                v-for="card in hour.appointments" :key="card.id"
                :card="card" selectable :selected="selected.includes(card.id)"
                :fields="agenda?.custom_fields"
                @toggle="toggle" @status="onStatus" @edit="onEdit"
              />
            </div>
          </div>
        </div>
      </div>
      </div>
    </template>

    <!-- The route: an ordered list with per-leg figures. The map is how you
         check a plan; this list is what you drive. -->
    <v-navigation-drawer v-model="routeOpen" location="right" temporary width="380">
      <v-toolbar density="compact" :title="t('agenda.planRoute')">
        <v-btn icon="mdi-close" size="small" variant="text" @click="routeOpen = false; clear()" />
      </v-toolbar>

      <div class="pa-4">
        <v-progress-linear v-if="routing" indeterminate class="mb-3" />

        <v-alert v-if="notIncluded" type="info" variant="tonal" density="compact">
          {{ t('agenda.routeNotIncluded') }}
        </v-alert>
        <v-alert v-else-if="routeError" type="warning" variant="tonal" density="compact">
          {{ routeError }}
        </v-alert>

        <template v-if="route">
          <div class="d-flex align-center ga-2 mb-3">
            <v-chip size="small" color="primary" variant="flat">
              {{ totalKm }} km · {{ totalMinutes }} min
            </v-chip>
            <!-- Says the figures are a guess. A straight-line duration
                 presented as a drive is how someone ends up late. -->
            <v-chip v-if="route.estimated" size="x-small" variant="tonal">
              {{ t('agenda.estimated') }}
            </v-chip>
          </div>

          <v-list density="compact">
            <v-list-item v-for="(stop, i) in route.stops" :key="`${stop.id}-${i}`">
              <template #prepend>
                <v-avatar size="24" color="primary" class="text-caption">{{ i }}</v-avatar>
              </template>
              <v-list-item-title class="text-body-2">{{ stop.label }}</v-list-item-title>
              <v-list-item-subtitle v-if="legBefore(stop.id, i)" class="text-caption">
                +{{ km(legBefore(stop.id, i)!.distance_meters) }} km ·
                {{ mins(legBefore(stop.id, i)!.duration_seconds) }} min
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </template>
      </div>
    </v-navigation-drawer>

    <!--
      The record's own form. Its field descriptors come from the agenda payload
      that is already on screen, so opening it costs one request for the values
      rather than two.
    -->
    <AppointmentEditDialog
      ref="editDialog"
      v-model="editOpen"
      :appointment-id="editingId"
      :descriptors="agenda?.custom_fields ?? []"
      :values="appointmentValues"
      :loading="editLoading"
      :saving="saving"
      @submit="onEditSubmit"
    />
  </div>
</template>

<style scoped>
/* Fills whatever the toolbar leaves, and scrolls inside itself rather than
   stretching the page — the columns keep their headers in view. */
.agenda-scroll {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* One group takes the height; several stack and scroll together, which is what
   grouping is for — you scan down the groups. */
.agenda-group:only-child {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
}

.agenda-grid {
  display: grid;
  /* Below about 180px a column cannot hold a title, a time and a
     status chip. Narrower than that the grid scrolls sideways
     rather than squeezing every card into illegibility. */
  grid-template-columns: repeat(7, minmax(180px, 1fr));
  gap: 8px;
  overflow-x: auto;
}
.agenda-grid--month { grid-auto-rows: minmax(78px, auto); }

/* Only the single-group case stretches: with several groups the grids are
   stacked and each should be as tall as its own content. */
.agenda-group:only-child .agenda-grid {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  max-width: 100%;
}

.agenda-col {
  background: rgb(var(--v-theme-background));
  border: 1px solid rgba(var(--v-border-color), 0.18);
  border-radius: 8px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
}
.agenda-col--today { border-color: rgb(var(--v-theme-primary)); }
.agenda-col--clickable { cursor: pointer; }
.agenda-col--clickable:hover { background: rgba(var(--v-theme-primary), 0.04); }

.agenda-col__head {
  padding: 6px 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}
.agenda-col__body {
  padding: 6px;
  flex: 1 1 auto;
  min-height: 0;
  /* A busy day scrolls in its own column instead of making every other column
     as tall as the busiest one. */
  overflow-y: auto;
}

.agenda-hour { width: 56px; padding-top: 6px; text-align: right; flex: 0 0 56px; }
</style>
