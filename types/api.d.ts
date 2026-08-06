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
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_super_admin: boolean;
  is_tenant_owner: boolean;
  last_login_at: string | null;
  channel?: string;
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

// Tipos para Auditoria
export interface AuditLogUser {
  id: number;
  type: 'Admin' | 'User';
  name: string;
}

export interface AuditLogModel {
  type: string; // Ex: "App\\Models\\User"
  id: number | null;
}

export interface AuditLogChanges {
  old: Record<string, any> | null;
  new: Record<string, any> | null;
}

export interface AuditLogContext {
  ip: string | null;
  user_agent: string | null;
  url: string | null;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | null;
}

export interface AuditLog {
  id: number;
  user: AuditLogUser;
  action: 'created' | 'updated' | 'deleted' | 'viewed' | 'login' | string;
  model: AuditLogModel;
  changes: AuditLogChanges;
  description: string | null;
  context: AuditLogContext;
  tags: string[] | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface AuditLogsResponse {
  success: boolean;
  data: AuditLog[];
  pagination: Pagination;
}

export interface AuditLogResponse {
  success: boolean;
  data: AuditLog;
}

// Tipos para Settings
export type SettingType = 'string' | 'boolean' | 'integer' | 'json';
export type SettingGroup = 'general' | 'features' | 'email' | 'storage' | string;

export interface Setting {
  key: string;
  value: string | boolean | number | null;
  group: SettingGroup;
  type: SettingType;
  label: string;
  description: string | null;
  is_public: boolean;
}

export interface SettingsResponse {
  success: boolean;
  data: Setting[];
}

export interface SettingResponse {
  success: boolean;
  data: Setting;
}

export type PublicSettings = Record<string, any>;

export interface PublicSettingsResponse {
  success: boolean;
  data: PublicSettings;
}

export interface UpdateSettingRequest {
  value: string | boolean | number | null;
}

export interface UpdateManySettingsRequest {
  settings: Array<{ key: string; value: string | boolean | number | null }>;
}

export interface AuditLogFilters {
  user_id?: number;
  user_type?: 'Admin' | 'User';
  model_type?: string;
  model_id?: number;
  action?: string;
  tags?: string; // Separado por vírgula
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
  per_page?: number;
  page?: number;
}

// Tipos para Multitenancy (branding + subscription)
export interface TenantTheme {
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  logo_url: string | null;
}

export interface TenantThemeResponse {
  success: boolean;
  data: TenantTheme;
}

export interface UpdateTenantBrandingRequest {
  theme_primary_color?: string;
  theme_secondary_color?: string;
  logo?: File; // send the raw file — takes precedence over logo_path if both are set
  logo_path?: string; // only for reassigning an already-hosted path; normally send `logo` instead
}

export interface TenantBranding {
  theme_primary_color: string | null;
  theme_secondary_color: string | null;
  logo_path: string | null;
  logo_url: string | null;
}

export interface UpdateTenantBrandingResponse {
  success: boolean;
  data: TenantBranding;
}

export interface UpdateSubscriptionPlanRequest {
  subscription_plan_id: string;
}

export interface UpdateSubscriptionPlanResponse {
  success: boolean;
}

// Tipos para o catálogo público de planos + self-service signup (landlord-level,
// sem tenant/auth) — ver /api/public/subscription-plans e /api/public/signup
export interface PublicSubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price_cents: number | null;
  features: Record<string, boolean>;
  tertiary_color: string | null;
  icon_small_url: string | null;
  icon_medium_url: string | null;
  icon_large_url: string | null;
}

export interface PublicSubscriptionPlansResponse {
  success: boolean;
  data: PublicSubscriptionPlan[];
}

export interface PublicSubscriptionPlanResponse {
  success: boolean;
  data: PublicSubscriptionPlan;
}

export interface PublicSignupRequest {
  name: string;
  subdomain: string;
  plan_id?: string;
  admin_email: string;
  admin_password: string;
  admin_password_confirmation: string;
}

export interface PublicSignupResult {
  subdomain: string;
  redirect_url: string;
}

export interface PublicSignupResponse {
  success: boolean;
  data: PublicSignupResult;
  message?: string;
}
