import { ApiClient } from '../http/ApiClient';
import type { OptimizedRoute, OptimizedRouteResponse, OptimizeRouteRequest } from '~/types/agenda';

/**
 * Route optimisation goes through our own backend, never straight to a maps
 * provider from here.
 *
 * That is deliberate and is the one thing the MADCRM study insists on changing:
 * from the browser the provider key is defended by a referrer allowlist alone,
 * any cache lives in one person's browser rather than the tenant's, and the
 * usage ledger would have to trust this code to report itself honestly.
 */
export class RouteRepository {
  private apiClient = new ApiClient();

  async optimize(request: OptimizeRouteRequest): Promise<OptimizedRoute> {
    const response = await this.apiClient.post<OptimizedRouteResponse>('/routes/optimize', request);
    return response.data;
  }
}
