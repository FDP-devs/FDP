// 사용자 정보
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// 로그인 요청
export interface LoginRequest {
  email: string;
  password: string;
}

// 로그인 응답
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// 회원가입 요청
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// 회원가입 응답
export interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// 토큰 갱신 응답
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// 인증 상태
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}
