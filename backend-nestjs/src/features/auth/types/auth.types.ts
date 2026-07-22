export interface IJwtPayload {
  sub: number;
  roleId: number;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ILoginResponse extends ITokenPair {
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
    role_id: number;
    permissions: string[];
    email_verified: boolean;
    has_password: boolean;
    providers: string[];
  };
}

export interface IAuthMeResponse {
  id: number;
  email: string;
  full_name: string;
  role: string;
  role_id: number;
  permissions: string[];
  is_active: boolean;
  email_verified: boolean;
  has_password: boolean;
  providers: string[];
}

export interface IRegisterResponse {
  email: string;
  expiresIn: number;
  message: string;
}

export interface IOAuthProfile {
  provider: string;
  providerId: string;
  email: string;
  fullName: string;
}
