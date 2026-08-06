import type { IHttpClient, RequestConfig } from '~/types/domain';
import { getApiConfig } from '~/config/api';
import { appendTenantQueryParam, getTenantSubdomain } from '~/utils/tenant';

interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export class ApiClient implements IHttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private tenantQueryParam: string | null;

  constructor(customBaseURL?: string) {
    const config = getApiConfig();
    this.baseURL = customBaseURL || config.baseURL;
    this.timeout = config.timeout;
    this.tenantQueryParam = config.tenantQueryParam;
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
    const fullURL = appendTenantQueryParam(`${this.baseURL}${url}`, this.tenantQueryParam);
    
    const headers = {
      ...this.defaultHeaders,
      ...config?.headers,
    };

    // Adicionar token de autenticação se disponível — exceto quando skipAuth
    // pede explicitamente pra não carregar um token de sessão anterior
    // (ex: login, que nunca deve enviar um Bearer de um tenant diferente).
    const token = config?.skipAuth ? null : this.getAuthToken();
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
        if (response.status === 401) {
          if (process.client) {
            // The redirect below is a hard reload, which wipes the console
            // before a plain console.error would be readable — stash it in
            // sessionStorage instead so the login page can surface it after.
            sessionStorage.setItem('last_401', JSON.stringify({
              method,
              url: fullURL,
              at: new Date().toISOString(),
            }));
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            // Preserve which tenant we were on — a plain "/auth/login" would
            // otherwise drop it from the URL, making it look like the app
            // forgot the tenant (it doesn't; dev_tenant_override in
            // localStorage still has it), but it's confusing to lose it from
            // the address bar right when you're trying to debug a failure.
            const tenant = getTenantSubdomain();
            window.location.href = tenant ? `/auth/login?tenant=${encodeURIComponent(tenant)}` : '/auth/login';
          }
          throw new Error('Unauthenticated');
        }

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

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', url, data, config);
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  async deleteWithBody<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, data, config);
  }
} 