export interface AuthUser {
  user_id: number;
  email: string;
  name: string;
  is_verified: boolean;
  provider?: string;
  avatar?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}
