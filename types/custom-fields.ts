// Tenant-defined fields — the JSON contract.
//
// Two shapes, and keeping them apart is the whole point. A DESCRIPTOR says
// what a field is (its label, its control, its colours) and travels ONCE per
// response. A VALUE says what one record holds and travels per row. They join
// on `field`.
//
// A week view carries around a hundred cards; merging the two would repeat the
// tenant's presentation config a hundred times, on every request.

/** How the tenant named and dressed one field, for the current reader. */
export interface CustomFieldDescriptor {
  /** The definition's stable handle. What a value joins on. */
  field: number;
  /** The storage column, `cf_7`. What a write submits under. */
  key: string;
  /** Which CONTROL to draw. Never what the field means. */
  type: CustomFieldType;
  /** The tenant's own name for it, already in the reader's language. */
  label: string;
  help_text: string | null;
  /** An icon NAME, not an icon. */
  icon: string | null;
  /**
   * Both colours arrive, always: the server does not know whether the reader
   * is in light or dark mode. Until this panel has a dark theme, the cell
   * reads `colour` — see components/CustomFields/CustomFieldValue.vue.
   */
  colour: string | null;
  colour_dark: string | null;
  /** 0 means inherit. */
  size: number;
  /** A named place on a card or row. Null means the form only. */
  slot: string | null;
  section: string | null;
  /**
   * The host's human name for that section.
   *
   * On the descriptor rather than in a separate map per response: a form
   * groups by `section` and needs a heading, and threading host metadata
   * through the agenda, the user list and every future entity payload to
   * supply one string is a worse trade than repeating it.
   */
  section_label: string | null;
  position: number;
  /** Whether THIS reader must fill it. */
  required: boolean;
  /** False when a `readonly` rule applies to this reader. */
  editable: boolean;
  items: unknown[] | null;
}

/** One record's value for one field. */
export interface CustomFieldValue {
  field: number;
  key: string;
  /** The machine value — what a form binds to and an export writes. */
  value: unknown;
  /** The formatted value, plain. Never markup. */
  text: string;
  href?: string;
}

/**
 * The closed set of controls.
 *
 * A union rather than a string, so adding a type to the backend registry
 * without teaching this panel to draw it is a build error rather than an
 * empty box on someone's screen.
 */
export type CustomFieldType = 'text';

/** A definition as the CONFIGURATION screen sees it — not the reading path. */
export interface CustomFieldDefinition {
  id: string;
  host: string;
  field: number;
  key: string;
  field_type: CustomFieldType;
  is_filterable: boolean;
  section: string | null;
  slot: string | null;
  position: number;
  icon: string | null;
  colour: string | null;
  colour_dark: string | null;
  font_size: number;
  is_required: boolean;
  pattern: string | null;
  /**
   * pending → live, or failed / missing.
   *
   * `pending` is not a spinner: MySQL commits implicitly on DDL, so the row
   * and its column cannot be created in one atomic act. The screen says so
   * rather than pretending the save finished.
   */
  state: 'pending' | 'live' | 'retiring' | 'retired' | 'purged' | 'failed' | 'missing';
  /**
   * A machine code plus parameters, translated here. The backend deliberately
   * does not send a sentence: it is produced inside a queued job, whose locale
   * is whoever dispatched it, and it would land untranslated on an otherwise
   * translated screen.
   */
  state_error: { code: string; params: Record<string, unknown> } | null;
  is_live: boolean;
  reconciled_at: string | null;
  labels: Record<string, { label: string; help_text: string | null; placeholder: string | null }>;
  role_rules: Partial<Record<'hidden' | 'readonly' | 'required', string[]>>;
}

/** What a host offers, and how much room it has left. */
export interface CustomFieldHost {
  key: string;
  slots: Record<string, string>;
  sections: Record<string, string>;
  enabled: boolean;
  budget: {
    max_secondary_indexes: number;
    max_columns: number;
    used: number;
    plan_limit: number | null;
  };
}

export interface CustomFieldTypeOption {
  key: CustomFieldType;
  can_filter: boolean;
}

export interface CustomFieldRoleOption {
  id: string;
  slug: string;
  name: string;
}

/**
 * The configuration screen's whole payload.
 *
 * Roles ride along on purpose: the per-role matrix needs them, and fetching
 * them from `/roles` instead would demand the unrelated `role-read` slug of
 * everyone allowed to define a field.
 */
export interface CustomFieldCatalogue {
  definitions: CustomFieldDefinition[];
  hosts: CustomFieldHost[];
  types: CustomFieldTypeOption[];
  roles: CustomFieldRoleOption[];
  locales: string[];
}

export interface CreateCustomFieldRequest {
  host: string;
  field_type: CustomFieldType;
  is_filterable?: boolean;
  section?: string | null;
  slot?: string | null;
  position?: number;
  icon?: string | null;
  colour?: string | null;
  colour_dark?: string | null;
  is_required?: boolean;
  pattern?: string | null;
  labels: Record<string, { label: string; help_text?: string | null }>;
  role_rules?: Partial<Record<'hidden' | 'readonly' | 'required', string[]>>;
}
