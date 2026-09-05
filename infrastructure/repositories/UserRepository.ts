import { ApiClient } from '../http/ApiClient';
import type { CustomFieldDescriptor, CustomFieldValue } from '~/types/custom-fields';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  email_verified_at: string | null;
  is_email_verified?: boolean;
  locale?: string | null;
}

/** A read carries the field context, so a form needs no second request. */
export interface UserDetailResponse {
  user: UserRecord;
  custom_fields: CustomFieldDescriptor[];
  custom: CustomFieldValue[];
}

export interface UserUpdateResponse {
  success: boolean;
  data: UserRecord;
  custom_fields: CustomFieldDescriptor[];
  custom: CustomFieldValue[];
  /**
   * Columns the server DROPPED because this admin may not write them.
   *
   * Not an error: a form loaded before somebody changed the per-role rules
   * must still be submittable. The screen says what was ignored rather than
   * refusing the whole save or — worse — accepting it silently.
   */
  ignored_fields?: string[];
}

export class UserRepository {
  private apiClient = new ApiClient();

  async get(id: string): Promise<UserDetailResponse> {
    return this.apiClient.get<UserDetailResponse>(`/users/${id}`);
  }

  async update(id: string, payload: Record<string, unknown>): Promise<UserUpdateResponse> {
    return this.apiClient.put<UserUpdateResponse>(`/users/${id}`, payload);
  }

  async create(payload: Record<string, unknown>): Promise<{ success: boolean; data: UserRecord }> {
    return this.apiClient.post(`/users`, payload);
  }

  async remove(id: string): Promise<void> {
    await this.apiClient.delete(`/users/${id}`);
  }
}
