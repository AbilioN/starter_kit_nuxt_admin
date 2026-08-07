import { TemplateRepository } from '~/infrastructure/repositories/TemplateRepository';
import type {
  Template,
  TemplateType,
  Pagination,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateBackgroundFile,
  TemplatePreviewResult,
} from '~/types/api';

export class TemplateService {
  private repository: TemplateRepository;

  constructor() {
    this.repository = new TemplateRepository();
  }

  async getTemplates(page = 1, perPage = 15, type?: TemplateType): Promise<{ data: Template[]; pagination: Pagination }> {
    return this.repository.getTemplates(page, perPage, type);
  }

  async getTemplate(id: string): Promise<Template> {
    return this.repository.getTemplate(id);
  }

  async createTemplate(data: CreateTemplateRequest): Promise<Template> {
    return this.repository.createTemplate(data);
  }

  async updateTemplate(id: string, data: UpdateTemplateRequest): Promise<Template> {
    return this.repository.updateTemplate(id, data);
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.repository.deleteTemplate(id);
  }

  async getBackgroundFiles(id: string): Promise<TemplateBackgroundFile[]> {
    return this.repository.getBackgroundFiles(id);
  }

  async uploadBackgroundFile(id: string, file: File): Promise<TemplateBackgroundFile[]> {
    return this.repository.uploadBackgroundFile(id, file);
  }

  async deleteBackgroundFile(id: string, fileId: string): Promise<void> {
    return this.repository.deleteBackgroundFile(id, fileId);
  }

  async preview(id: string, promptValues?: Record<string, string>): Promise<TemplatePreviewResult> {
    return this.repository.preview(id, promptValues);
  }
}
