import type { IHttpClient, RequestConfig } from '~/types/domain';
import { getApiConfig } from '~/config/api';

interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export class ApiClient implements IHttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(customBaseURL?: string) {
    const config = getApiConfig();
    this.baseURL = customBaseURL || config.baseURL;
    this.timeout = config.timeout;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private getAuthToken(): string | null {
    if (process.client) {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private async request<T>(
    method: string,
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    const fullURL = `${this.baseURL}${url}`;
    
    const headers = {
      ...this.defaultHeaders,
      ...config?.headers,
    };

    // Adicionar token de autenticação se disponível
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const requestConfig: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    };

    try {
      // Criar um timeout para a requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(fullURL, {
        ...requestConfig,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        // Tentar extrair mensagem de erro da API
        if (isJson) {
          const errorData = await response.json() as ApiErrorResponse;
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      if (isJson) {
        return await response.json();
      } else {
        return await response.text() as T;
      }
    } catch (error) {
      console.error('API request failed:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  async deleteWithBody<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, data, config);
  }
} 