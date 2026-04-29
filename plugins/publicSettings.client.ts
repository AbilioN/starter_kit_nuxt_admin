export default defineNuxtPlugin(async () => {
  const { loadPublicSettings } = useSettings();
  await loadPublicSettings();
});
