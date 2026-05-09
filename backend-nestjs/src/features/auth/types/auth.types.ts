export interface IJwtPayload {
  sub: number;
  email: string;
  role: string;
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
  };
}
