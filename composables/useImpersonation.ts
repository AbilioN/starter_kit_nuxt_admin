import type { ImpersonationState } from '~/types/api';
import { ImpersonationService } from '~/services/ImpersonationService';

/**
 * Whether this panel session belongs to a GodAdmin support session, and how to
 * end it.
 *
 * Nothing here runs on call. Calling this composable must not mutate state or
 * fire a request: it is used inside the layout, which renders on every page,
 * and a call-time side effect there is exactly what caused the render-abort
 * loop documented in useAuth/usePermissions. `load()` is explicit and idempotent.
 */
export const useImpersonation = () => {
  const state = useState<ImpersonationState>('impersonation', () => ({ active: false }));
  const loaded = useState<boolean>('impersonationLoaded', () => false);

  const load = async (force = false): Promise<void> => {
    if (loaded.value && !force) return;
    if (!process.client) return;

    // No token means no session to describe — and asking would just 401.
    if (!localStorage.getItem('auth_token')) {
      state.value = { active: false };
      return;
    }

    const result = await new ImpersonationService().getState();

    if (result.success && result.data) {
      state.value = result.data;
      loaded.value = true;
    }
  };

  /**
   * Ends the session server-side (which revokes the token and writes the audit
   * entry), then clears this browser. The local cleanup runs even if the call
   * fails: leaving the operator holding a token the server may still accept is
   * the worse outcome, and the token expires on its own regardless.
   */
  const stop = async (): Promise<void> => {
    try {
      await new ImpersonationService().stop();
    } finally {
      state.value = { active: false };
      loaded.value = false;

      if (process.client) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('roles');
        localStorage.removeItem('permissions');
      }

      await navigateTo('/auth/login');
    }
  };

  return { state: readonly(state), load, stop };
};
