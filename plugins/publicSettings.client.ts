export default defineNuxtPlugin(() => {
  const { loadPublicSettings } = useSettings();
  // Fire-and-forget — public settings are non-critical at boot.
  // Awaiting this blocked app initialisation whenever the backend was slow or down.
  loadPublicSettings();
});
