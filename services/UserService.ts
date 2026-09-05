import { UserRepository } from '~/infrastructure/repositories/UserRepository';
import type { UserDetailResponse, UserUpdateResponse } from '~/infrastructure/repositories/UserRepository';

/**
 * The write side of end-user management.
 *
 * Reads still go through AuthService.getUsers() for the list, which is where
 * they have always lived; this covers the endpoints that did not exist until
 * 2026-09-05 — routes/api.php advertised create/update/delete against
 * UserController methods that were never written.
 */
export class UserService {
  private repository = new UserRepository();

  async get(id: string): Promise<UserDetailResponse> {
    return this.repository.get(id);
  }

  async update(id: string, payload: Record<string, unknown>): Promise<UserUpdateResponse> {
    return this.repository.update(id, payload);
  }

  async create(payload: Record<string, unknown>) {
    return this.repository.create(payload);
  }

  async remove(id: string): Promise<void> {
    return this.repository.remove(id);
  }
}
