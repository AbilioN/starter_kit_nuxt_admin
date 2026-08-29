import { RouteService } from '~/services/RouteService';
import type { OptimizedRoute, OptimizeRouteRequest } from '~/types/agenda';

/**
 * Turns a selection of appointments into the order to drive them.
 *
 * The deliverable is not a line on a map: it is an ordered list with a distance
 * and a time against every hop. The map is how someone checks the plan; the
 * list is what they drive. So this exposes the ordered stops and their legs,
 * and drawing is the page's problem.
 */
export const useRouteOptimizer = () => {
  const routeService = new RouteService();

  const route = ref<OptimizedRoute | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  /** Set when the workspace's plan does not include route optimisation. */
  const notIncluded = ref(false);

  const optimize = async (request: OptimizeRouteRequest): Promise<OptimizedRoute | null> => {
    loading.value = true;
    error.value = null;
    notIncluded.value = false;

    try {
      route.value = await routeService.optimize(request);
      return route.value;
    } catch (e: any) {
      if (e?.response?.data?.error === 'feature_disabled') {
        notIncluded.value = true;
      } else {
        // Caps come back as plain messages telling the person what to change,
        // usually "select fewer stops". Surfaced as-is rather than replaced
        // with a generic failure.
        error.value = e?.response?.data?.message ?? 'Could not compute the route.';
      }

      route.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  };

  const clear = () => { route.value = null; error.value = null; notIncluded.value = false; };

  const totalKm = computed(() =>
    route.value ? Math.round(route.value.total_distance_meters / 100) / 10 : 0);

  const totalMinutes = computed(() =>
    route.value ? Math.round(route.value.total_duration_seconds / 60) : 0);

  return {
    route: readonly(route),
    loading: readonly(loading),
    error: readonly(error),
    notIncluded: readonly(notIncluded),
    totalKm,
    totalMinutes,
    optimize,
    clear,
  };
};
