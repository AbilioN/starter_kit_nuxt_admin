import { RouteRepository } from '~/infrastructure/repositories/RouteRepository';
import type { OptimizedRoute, OptimizeRouteRequest } from '~/types/agenda';

export class RouteService {
  private repository = new RouteRepository();

  optimize(request: OptimizeRouteRequest): Promise<OptimizedRoute> {
    return this.repository.optimize(request);
  }
}
