import { ApiClient } from '../http/ApiClient';
import type {
  CreateCustomFieldRequest,
  CustomFieldCatalogue,
  CustomFieldDefinition,
} from '~/types/custom-fields';

interface CatalogueResponse {
  success: boolean;
  data: CustomFieldCatalogue;
}

interface DefinitionResponse {
  success: boolean;
  data: CustomFieldDefinition;
}

/**
 * The CONFIGURATION endpoints only.
 *
 * Reading a field's values never comes through here: an entity's own response
 * already carries its custom fields as context, so a screen that shows records
 * makes no second request. This repository serves the separate, larger,
 * differently-permissioned job of inventing fields.
 */
export class CustomFieldRepository {
  private apiClient = new ApiClient();

  /**
   * Definitions, hosts, types, roles and locales — one request.
   *
   * The whole screen in one payload, matching how the agenda and the template
   * editor already work here.
   */
  async getCatalogue(): Promise<CustomFieldCatalogue> {
    const response = await this.apiClient.get<CatalogueResponse>('/custom-fields');
    return response.data;
  }

  /**
   * Answers 202, and the definition comes back `pending`.
   *
   * Not a failure and not a spinner to hide: the column is created by a queued
   * job because MySQL commits implicitly on DDL, so the row and the ALTER
   * cannot be one atomic act. The screen shows the state and refreshes.
   */
  async create(payload: CreateCustomFieldRequest): Promise<CustomFieldDefinition> {
    const response = await this.apiClient.post<DefinitionResponse>('/custom-fields', payload);
    return response.data;
  }

  /** Re-queues the reconcile for a host whose definitions are stuck. */
  async reconcile(host: string): Promise<void> {
    await this.apiClient.post(`/custom-fields/${host}/reconcile`, {});
  }
}
