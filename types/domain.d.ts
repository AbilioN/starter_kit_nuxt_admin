// Interfaces do Domínio
export interface IAuthRepository {
  login(email: string, password: string): Promise<LoginResponse>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<Admin | null>;
}

export interface IHttpClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  // Don't attach the stored Bearer token — for endpoints that must never
  // carry a leftover token from a previous (possibly different-tenant)
  // session, e.g. login itself.
  skipAuth?: boolean;
}

export interface IAuthService {
  login(email: string, password: string): Promise<ApiResponse<LoginResponse>>;
  logout(): Promise<void>;
  isAuthenticated(): boolean;
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
} 