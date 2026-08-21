
/**
 * A GodAdmin support session, as reported by GET /api/admin/impersonation.
 * `active: false` is the ordinary case — this endpoint answers for every
 * session, not only impersonated ones.
 */
export interface ImpersonationState {
  active: boolean;
  operator?: string;
  can_write?: boolean;
  expires_at?: string | null;
  admin_name?: string;
}

export interface ImpersonationStateResponse {
  success: boolean;
  data: ImpersonationState;
}
