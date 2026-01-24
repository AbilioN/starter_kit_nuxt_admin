// Tipos da API
export interface Permission {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  resource: string;
  action: string;
  route: string | null;
}

export interface Admin {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  is_super_admin: boolean;
  last_login_at: string | null;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  admin: Admin;
  token: string;
  roles: Role[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
  error?: string;
}

// Tipos para Usuários
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

export interface UsersResponse {
  users: User[];
  pagination: Pagination;
}

export interface AdminsResponse {
  admins: Admin[];
  pagination?: Pagination;
}

// A API de roles retorna um array direto, não um objeto com paginação
export type RolesResponse = Role[];

export interface PermissionsResponse {
  success: boolean;
  data: Permission[];
}

// Request types for Role CRUD
export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions?: number[];
}

export interface UpdateRoleRequest {
  id: number;
  name: string;
  description: string;
}

export interface DeleteRoleRequest {
  id: number;
}

export interface UpdateRolePermissionsRequest {
  id: number;
  permissions: number[];
}

// Response types for Role CRUD
export interface RoleResponse {
  success: boolean;
  data: {
    role: Role;
  };
}

// Request types for Admin CRUD
export interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  is_active: boolean;
  role_id?: number;
}

export interface UpdateAdminRequest {
  id: number;
  name?: string;
  email?: string;
  is_active?: boolean;
}

export interface DeleteAdminRequest {
  id: number;
}

// Response types for Admin CRUD
export interface AdminResponse {
  success: boolean;
  data: Admin;
}

export interface AdminsListResponse {
  success: boolean;
  data: Admin[];
  pagination: Pagination;
} 