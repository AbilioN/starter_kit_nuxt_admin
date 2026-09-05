import { ApiError } from '~/infrastructure/http/ApiClient';
import { AgendaService } from '~/services/AgendaService';
import type {
  Agenda, AgendaFilters, AgendaGroupBy, AgendaView, AppointmentCard,
} from '~/types/agenda';
import type { CustomFieldValue } from '~/types/custom-fields';

/**
 * The agenda screen's state.
 *
 * The view and the date live HERE and are meant to be mirrored into the URL by
 * the page, not kept in a server session. MADCRM keeps them server-side and its
 * own study says to change it: in the URL an agenda view is linkable and two
 * tabs stop fighting over one cursor.
 */
export const useAgenda = () => {
  // Constructed here rather than at module scope — the service's ApiClient
  // reaches getApiConfig() -> useRuntimeConfig(), which needs a live Nuxt
  // context, unavailable at import time.
  const agendaService = new AgendaService();

  const agenda = useState<Agenda | null>('agenda', () => null);
  const view = useState<AgendaView>('agendaView', () => 'week');
  const date = useState<string>('agendaDate', () => new Date().toISOString().slice(0, 10));
  const groupBy = useState<AgendaGroupBy | null>('agendaGroupBy', () => null);
  const filters = useState<AgendaFilters>('agendaFilters', () => ({}));

  const loading = ref(false);
  const error = ref<string | null>(null);
  /** Set when the workspace does not have the agenda enabled at all. */
  const disabled = ref(false);

  const load = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      agenda.value = await agendaService.getAgenda(view.value, date.value, filters.value, groupBy.value);
      disabled.value = false;
    } catch (e: any) {
      // The backend answers a switched-off feature with a machine-readable
      // code rather than an empty diary, so the panel can say "not enabled"
      // instead of "no appointments" — the difference between an explanation
      // and a lie.
      if (e?.response?.data?.error === 'feature_disabled') {
        disabled.value = true;
        agenda.value = null;
      } else {
        error.value = e?.response?.data?.message ?? 'Could not load the agenda.';
      }
    } finally {
      loading.value = false;
    }
  };

  const setView = async (next: AgendaView) => { view.value = next; await load(); };
  const setDate = async (next: string) => { date.value = next; await load(); };
  const setGroupBy = async (next: AgendaGroupBy | null) => { groupBy.value = next; await load(); };
  const setFilters = async (next: AgendaFilters) => { filters.value = next; await load(); };

  /** Step one window in either direction, in the unit the current view uses. */
  const shift = async (direction: -1 | 1) => {
    const current = new Date(date.value);

    if (view.value === 'day') current.setDate(current.getDate() + direction);
    else if (view.value === 'week') current.setDate(current.getDate() + 7 * direction);
    else current.setMonth(current.getMonth() + direction);

    date.value = current.toISOString().slice(0, 10);
    await load();
  };

  /**
   * One-click status change from a card, then a reload.
   *
   * Reloading the whole screen rather than patching the card in place is on
   * purpose: statuses feed the per-day and per-group confirmed counts, and a
   * locally patched card would leave those stale — the screen would quietly
   * disagree with itself.
   */
  const changeStatus = async (appointmentId: string, statusId: string): Promise<void> => {
    await agendaService.changeStatus(appointmentId, statusId);
    await load();
  };

  /** Every card on screen, whatever view or grouping produced it. */
  const visibleCards = computed<AppointmentCard[]>(() => {
    const cards: AppointmentCard[] = [];

    for (const group of agenda.value?.groups ?? []) {
      for (const day of group.days ?? []) cards.push(...(day.appointments ?? []));
      for (const hour of group.hours ?? []) cards.push(...hour.appointments);
    }

    return cards;
  });

  /** The stops a route could actually be built from: those with coordinates. */
  const routableCards = computed<AppointmentCard[]>(() =>
    visibleCards.value.filter(card => card.location.geocoded));

  const saving = ref(false);

  /** One appointment's custom values, loaded when its form opens. */
  const appointmentValues = ref<CustomFieldValue[]>([]);

  /**
   * One appointment, with its custom values.
   *
   * `GET /api/admin/appointments/{id}` did not exist until 2026-09-05 —
   * routes/api.php registered create/update/delete and no way to read a single
   * record, so a form had nothing to open with.
   */
  const fetchAppointment = async (id: string) => {
    const detail = await new AgendaService().getAppointment(id);
    appointmentValues.value = detail.custom ?? [];

    return detail.data;
  };

  /**
   * @returns the columns the server dropped because this admin may not write
   *          them, or null when the save failed.
   */
  const saveAppointment = async (id: string, payload: Record<string, unknown>): Promise<string[] | null> => {
    saving.value = true;

    try {
      const result = await new AgendaService().updateAppointment(id, payload);
      appointmentValues.value = result.custom ?? [];
      await load();

      return result.ignored_fields ?? [];
    } catch (e: any) {
      // A 422 belongs on the fields the server named; anything else is a
      // failure the person cannot fix by editing an input.
      if (e instanceof ApiError && Object.keys(e.errors).length > 0) throw e;

      error.value = e?.message ?? 'Could not save the appointment.';

      return null;
    } finally {
      saving.value = false;
    }
  };

  return {
    agenda: readonly(agenda),
    saving: readonly(saving),
    appointmentValues: readonly(appointmentValues),
    fetchAppointment,
    saveAppointment,
    view: readonly(view),
    date: readonly(date),
    groupBy: readonly(groupBy),
    filters: readonly(filters),
    loading: readonly(loading),
    error: readonly(error),
    disabled: readonly(disabled),
    visibleCards,
    routableCards,
    load,
    setView,
    setDate,
    setGroupBy,
    setFilters,
    shift,
    changeStatus,
  };
};
