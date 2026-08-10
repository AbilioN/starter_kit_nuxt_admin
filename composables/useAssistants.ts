import type { Assistant } from '~/types/chat';
import { AssistantService } from '~/services/AssistantService';

export const useAssistants = () => {
  // Constructed here, not at module scope — AssistantService's ApiClient
  // calls getApiConfig() -> useRuntimeConfig(), which needs a live Nuxt context.
  const assistantService = new AssistantService();

  const assistants = useState<Assistant[]>('assistants', () => []);
  const loading = ref(false);
  const loaded = ref(false);

  const loadAssistants = async (): Promise<void> => {
    if (loaded.value || loading.value) return;
    loading.value = true;
    try {
      assistants.value = await assistantService.getAssistants();
      loaded.value = true;
    } catch {
      // Non-critical — the "AI Agents" section just stays empty/hidden,
      // same "never block the app on a progressive-enhancement fetch"
      // philosophy as useTenantTheme.ts.
    } finally {
      loading.value = false;
    }
  };

  return {
    assistants: readonly(assistants),
    loading: readonly(loading),
    loadAssistants,
  };
};
