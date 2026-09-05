import { CustomFieldRepository } from '~/infrastructure/repositories/CustomFieldRepository';
import type {
  CreateCustomFieldRequest,
  CustomFieldCatalogue,
  CustomFieldDefinition,
} from '~/types/custom-fields';

/**
 * Orchestration layer, kept thin like its siblings — the panel's chain is
 * page → composable → service → repository → ApiClient, and skipping a link
 * is how the two upload methods lost their tenant handling.
 */
export class CustomFieldService {
  private repository = new CustomFieldRepository();

  async getCatalogue(): Promise<CustomFieldCatalogue> {
    return this.repository.getCatalogue();
  }

  async create(payload: CreateCustomFieldRequest): Promise<CustomFieldDefinition> {
    return this.repository.create(payload);
  }

  async reconcile(host: string): Promise<void> {
    return this.repository.reconcile(host);
  }
}
