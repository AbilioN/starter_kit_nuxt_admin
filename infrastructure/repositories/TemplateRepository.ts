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

  // Preview for text/html/positions bodies only — a 'pdf'+'html' or
  // 'pdf'+'positions' template returns raw PDF bytes instead, which needs
  // a separate binary-aware call (added alongside the PDF editor).
  async preview(id: string, promptValues?: Record<string, string>): Promise<TemplatePreviewResult> {
    const response = await this.apiClient.post<TemplatePreviewResponse>(`/templates/${id}/preview`, {
      prompt_values: promptValues ?? {},
    });
    return response.data;
  }
}
