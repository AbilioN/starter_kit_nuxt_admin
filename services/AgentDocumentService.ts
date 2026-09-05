import { AgentDocumentRepository } from '~/infrastructure/repositories/AgentDocumentRepository';
import type { AgentDocument, SaveAgentDocumentPayload } from '~/types/agent-documents';

/**
 * Thin, like its siblings — page → composable → service → repository →
 * ApiClient, and skipping a link is how the two upload methods lost their
 * tenant handling.
 */
export class AgentDocumentService {
  private repository = new AgentDocumentRepository();

  async list(): Promise<AgentDocument[]> {
    return this.repository.list();
  }

  async get(id: string): Promise<AgentDocument> {
    return this.repository.get(id);
  }

  async save(payload: SaveAgentDocumentPayload, id?: string): Promise<AgentDocument> {
    return id ? this.repository.update(id, payload) : this.repository.create(payload);
  }

  async remove(id: string): Promise<void> {
    return this.repository.remove(id);
  }
}
