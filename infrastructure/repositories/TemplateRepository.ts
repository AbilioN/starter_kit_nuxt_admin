import { ApiClient } from '../http/ApiClient';
import { getApiConfig } from '~/config/api';
import { appendTenantQueryParam } from '~/utils/tenant';
import type {
  Template,
  TemplateType,
  Pagination,
  TemplatesResponse,
  TemplateResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateBackgroundFile,
  TemplateBackgroundFilesResponse,
  TemplatePreviewResult,
  TemplatePreviewResponse,
  TemplateFieldCatalog,
  TemplateFindings,
} from '~/types/api';

export class TemplateRepository {
  private apiClient: ApiClient;
  private baseURL = getApiConfig().baseURL;
  private tenantQueryParam = getApiConfig().tenantQueryParam;

  constructor() {
    this.apiClient = new ApiClient();
  }

  async getTemplates(page = 1, perPage = 15, type?: TemplateType): Promise<{ data: Template[]; pagination: Pagination }> {
    let url = `/templates?page=${page}&per_page=${perPage}`;
    if (type) url += `&type=${encodeURIComponent(type)}`;
    const response = await this.apiClient.get<TemplatesResponse>(url);
    return { data: response.data, pagination: response.pagination };
  }

  async getFieldCatalog(): Promise<TemplateFieldCatalog> {
    const response = await this.apiClient.get<{ success: boolean; data: TemplateFieldCatalog }>('/templates/fields');
    return response.data;
  }

  // Takes the raw text, not a template id, so a bad placeholder surfaces
  // while the author is still typing rather than after a save.
  async validateBody(body: string | null, subject?: string | null): Promise<TemplateFindings> {
    const response = await this.apiClient.post<{ success: boolean; data: TemplateFindings }>(
      '/templates/validate',
      { body, subject },
    );
    return response.data;
  }

  async getTranslations(id: string): Promise<Template[]> {
    const response = await this.apiClient.get<{ success: boolean; data: Template[] }>(`/templates/${id}/translations`);
    return response.data;
  }

  async getTemplate(id: string): Promise<Template> {
    const response = await this.apiClient.get<TemplateResponse>(`/templates/${id}`);
    return response.data;
  }

  async createTemplate(data: CreateTemplateRequest): Promise<Template> {
    const response = await this.apiClient.post<TemplateResponse>('/templates', data);
    return response.data;
  }

  async updateTemplate(id: string, data: UpdateTemplateRequest): Promise<Template> {
    const response = await this.apiClient.put<TemplateResponse>(`/templates/${id}`, data);
    return response.data;
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.apiClient.delete<{ success: boolean }>(`/templates/${id}`);
  }

  async getBackgroundFiles(id: string): Promise<TemplateBackgroundFile[]> {
    const response = await this.apiClient.get<TemplateBackgroundFilesResponse>(`/templates/${id}/background`);
    return response.data;
  }

  // multipart/form-data — ApiClient only sends JSON bodies, same reason
  // FileRepository.uploadFile() bypasses it and uses fetch() directly.
  async uploadBackgroundFile(id: string, file: File): Promise<TemplateBackgroundFile[]> {
    const token = process.client ? localStorage.getItem('auth_token') : null;
    const formData = new FormData();
    formData.append('file', file);

    const url = appendTenantQueryParam(`${this.baseURL}/templates/${id}/background`, this.tenantQueryParam);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token ?? ''}`,
        Accept: 'application/json',
      },
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(body.message ?? `Background upload failed: ${res.status}`);
    }
    const json = await res.json() as TemplateBackgroundFilesResponse;
    return json.data;
  }

  async deleteBackgroundFile(id: string, fileId: string): Promise<void> {
    await this.apiClient.delete<{ success: boolean }>(`/templates/${id}/background/${fileId}`);
  }

  // Preview for text/html/positions bodies only — a 'pdf' template returns
  // raw PDF bytes instead (see previewPdf below), which ApiClient can't
  // carry: it calls response.text() on non-JSON bodies, corrupting binary.
  async preview(id: string, promptValues?: Record<string, string>): Promise<TemplatePreviewResult> {
    const response = await this.apiClient.post<TemplatePreviewResponse>(`/templates/${id}/preview`, {
      prompt_values: promptValues ?? {},
    });
    return response.data;
  }

  // Same endpoint as preview(), but for 'pdf' templates, which respond with
  // raw PDF bytes (Content-Type: application/pdf) instead of JSON — needs
  // a raw fetch() + blob() to keep the bytes intact.
  async previewPdf(id: string, promptValues?: Record<string, string>): Promise<Blob> {
    const token = process.client ? localStorage.getItem('auth_token') : null;
    const url = appendTenantQueryParam(`${this.baseURL}/templates/${id}/preview`, this.tenantQueryParam);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token ?? ''}`,
        Accept: 'application/pdf',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt_values: promptValues ?? {} }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(body.message ?? `Preview failed: ${res.status}`);
    }
    return res.blob();
  }
}
