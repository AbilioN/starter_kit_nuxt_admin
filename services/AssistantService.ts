import { AssistantRepository } from '~/infrastructure/repositories/AssistantRepository';
import type { Assistant } from '~/types/chat';

export class AssistantService {
  private repository: AssistantRepository;

  constructor() {
    this.repository = new AssistantRepository();
  }

  async getAssistants(): Promise<Assistant[]> {
    return this.repository.getAssistants();
  }
}
