import { ApiClient } from '../http/ApiClient';
import type { Assistant, AssistantsResponse } from '~/types/chat';

// Uses the standard tenant-aware ApiClient()/getApiConfig() convention used
// everywhere else in the app — deliberately not replicating ChatRepository's
// hardcoded http://localhost:8006/api pattern, a pre-existing inconsistency
// not worth propagating into new code.
export class AssistantRepository {
  private apiClient = new ApiClient();

  async getAssistants(): Promise<Assistant[]> {
    const response = await this.apiClient.get<AssistantsResponse>('/assistants');
    return response.data;
  }
}
