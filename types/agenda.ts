// The agenda's JSON contract.
//
// Mirrors what the backend builds in BuildAgendaUseCase. The server computes
// the whole screen — window, grid, counts, cards and their menus — and this
// panel renders it; nothing here recomputes a total or decides whether an
// action applies.

export interface AgendaTotals {
  count: number;
  confirmed: number;
}

export interface AppointmentTypeRef {
  slug: string;
  label: string;
  color: string;
  icon: string | null;
}

export interface AppointmentStatusRef {
  slug: string;
  label: string;
  color: string;
  confirmed: boolean;
}

export interface AppointmentLocation {
  address: string | null;
  postcode: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  /** False means this stop cannot take part in a route yet. */
  geocoded: boolean;
}

/**
 * One entry of a card's menu.
 *
 * Two shapes: a `link` the panel opens, or an `endpoint` it calls. Both are
 * assembled server-side, so the panel never builds a provider URL or learns a
 * route it should not know.
 */
export interface AppointmentAction {
  key: string;
  label: string;
  icon: string | null;
  kind: 'link' | 'endpoint';
  href?: string;
  target?: string;
  endpoint?: string;
  method?: string;
  field?: string;
  options?: Array<{ id: string; label: string; color: string }>;
  payload?: Record<string, unknown>;
}

/** Keyed by sub-menu: `general`, `contact`, `export`, `planning`. */
export type AppointmentActions = Record<string, AppointmentAction[]>;

export interface AppointmentCard {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  /** True when the appointment continues on another day. */
  spans_days: boolean;
  type: AppointmentTypeRef | null;
  status: AppointmentStatusRef | null;
  assigned_admin_id: string | null;
  location: AppointmentLocation;
  subject: { type: string; id: string } | null;
  actions: AppointmentActions;
}

export interface AgendaDay extends AgendaTotals {
  date: string;
  is_today: boolean;
  /** Null in the month view, which carries counts only — by design. */
  appointments: AppointmentCard[] | null;
}

export interface AgendaHour extends AgendaTotals {
  hour: number;
  label: string;
  appointments: AppointmentCard[];
}

export interface AgendaGroup {
  key: string | null;
  label: string | null;
  totals: AgendaTotals;
  days?: AgendaDay[];
  hours?: AgendaHour[];
}

export type AgendaView = 'day' | 'week' | 'month';
export type AgendaGroupBy = 'assigned_admin' | 'type' | 'status' | 'city';

export interface AgendaFilters {
  type_id?: string | null;
  status_id?: string | null;
  assigned_admin_id?: string | null;
}

export interface Agenda {
  view: AgendaView;
  date: string;
  from: string;
  to: string;
  iso_week: number;
  group_by: AgendaGroupBy | null;
  filters: AgendaFilters;
  totals: AgendaTotals;
  groups: AgendaGroup[];
}

export interface AgendaResponse {
  success: boolean;
  data: Agenda;
}

// --- Routing --------------------------------------------------------------

export interface RouteStop {
  order: number;
  id: string;
  label: string;
  address: string | null;
  lat: number;
  lng: number;
}

export interface RouteLeg {
  from: string;
  to: string;
  distance_meters: number;
  duration_seconds: number;
}

export interface OptimizedRoute {
  provider: string;
  /**
   * True when the figures are straight-line estimates rather than driving
   * data. Must be surfaced: a guess presented as a duration is how a driver
   * ends up late.
   */
  estimated: boolean;
  stops: RouteStop[];
  legs: RouteLeg[];
  total_distance_meters: number;
  total_duration_seconds: number;
}

export interface OptimizeRouteRequest {
  appointment_ids: string[];
  origin_appointment_id?: string | null;
  destination_appointment_id?: string | null;
  round_trip?: boolean;
}

export interface OptimizedRouteResponse {
  success: boolean;
  data: OptimizedRoute;
}
