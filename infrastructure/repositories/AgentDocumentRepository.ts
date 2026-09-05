import { ApiClient } from '../http/ApiClient';
import type { AgentDocument, SaveAgentDocumentPayload } from '~/types/agent-documents';

interface ListResponse {
  success: boolean;
  data: AgentDocument[];
}

interface SingleResponse {
  success: boolean;
  data: AgentDocument;
}

/**
 * The documents the assistant can search.
 *
 * Writes go as multipart, always — a document may carry a file, and sending
 * one shape sometimes and another shape otherwise is how an endpoint ends up
 * with two code paths and one of them untested.
 *
 * Updates are POST rather than PATCH for the same reason: browsers cannot send
 * multipart on a PATCH without a method-override dance, and the backend route
 * is POST for exactly that.
 */
export class AgentDocumentRepository {
  private apiClient = new ApiClient();

  async list(): Promise<AgentDocument[]> {
    const response = await this.apiClient.get<ListResponse>('/agent-documents');
    return response.data;
  }

  async get(id: string): Promise<AgentDocument> {
    const response = await this.apiClient.get<SingleResponse>(`/agent-documents/${id}`);
    return response.data;
  }

  async create(payload: SaveAgentDocumentPayload): Promise<AgentDocument> {
    const response = await this.apiClient.post<SingleResponse>(
      '/agent-documents',
      this.toFormData(payload),
    );
    return response.data;
  }

  async update(id: string, payload: SaveAgentDocumentPayload): Promise<AgentDocument> {
    const response = await this.apiClient.post<SingleResponse>(
      `/agent-documents/${id}`,
      this.toFormData(payload),
    );
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await this.apiClient.delete(`/agent-documents/${id}`);
  }

  private toFormData(payload: SaveAgentDocumentPayload): FormData {
    const form = new FormData();

    form.append('title', payload.title);

    if (payload.description) form.append('description', payload.description);
    if (payload.audience) form.append('audience', payload.audience);
    if (payload.content) form.append('content', payload.content);
    if (payload.file) form.append('file', payload.file);

    // A boolean must cross as the string Laravel's `boolean` rule accepts;
    // `false` stringifies to "false", which it reads as false, but an omitted
    // field would leave the existing value alone — which is not the same thing.
    if (payload.is_active !== undefined) {
      form.append('is_active', payload.is_active ? '1' : '0');
    }

    return form;
  }
}
