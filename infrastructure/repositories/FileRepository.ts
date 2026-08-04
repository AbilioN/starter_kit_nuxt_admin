import { getApiConfig } from '~/config/api';
import { appendTenantQueryParam } from '~/utils/tenant';
import { ApiClient } from '../http/ApiClient';

export interface FileItem {
  id: string;
  original_name: string;
  mime_type: string;
  size: number;
  size_human: string;
  folder: string | null;
  is_public: boolean;
  url: string;
  meta: Record<string, any> | null;
  created_at: string;
}

export interface FilesListResponse {
  success: boolean;
  data: FileItem[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface UploadFileResponse {
  success: boolean;
  data: FileItem; // FileDto fields: id, original_name, mime_type, size, size_human, folder, is_public, url, meta, created_at
}

export class FileRepository {
  private apiClient = new ApiClient();
  private baseURL = getApiConfig().baseURL;
  private tenantQueryParam = getApiConfig().tenantQueryParam;

  async getFiles(page = 1, perPage = 20, folder?: string): Promise<FilesListResponse> {
    let url = `/files?page=${page}&per_page=${perPage}`;
    if (folder) url += `&folder=${encodeURIComponent(folder)}`;
    return this.apiClient.get<FilesListResponse>(url);
  }

  async uploadFile(file: File, folder?: string): Promise<UploadFileResponse> {
    const token = process.client ? localStorage.getItem('auth_token') : null;
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);

    const url = appendTenantQueryParam(`${this.baseURL}/files`, this.tenantQueryParam);
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
      throw new Error(body.message ?? `Upload failed: ${res.status}`);
    }
    return res.json() as Promise<UploadFileResponse>;
  }

  async deleteFile(id: string): Promise<{ success: boolean }> {
    return this.apiClient.delete<{ success: boolean }>(`/files/${id}`);
  }
}
