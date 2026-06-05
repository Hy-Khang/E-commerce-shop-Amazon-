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
}
