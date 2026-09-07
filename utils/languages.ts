/**
 * The languages this panel ships translations for.
 *
 * Mirrors `config('app.available_locales')` on the backend, which is the real
 * bound — a write is validated there. This list exists so the switcher and the
 * languages screen cannot disagree about which four exist or what they are
 * called, which they did while each carried its own copy.
 */
export const PANEL_LANGUAGES = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
] as const;

export type PanelLanguageCode = (typeof PANEL_LANGUAGES)[number]['code'];
