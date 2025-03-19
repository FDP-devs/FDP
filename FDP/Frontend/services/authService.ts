import { LoginResponse, User } from '../types/auth';
import apiClient, { ApiResponse } from './apiClient';
import TokenService from './tokenService';

// 인증 관련 API 서비스
export const AuthService = {
  // 로그인
  login: async (email: string, password: string) => {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      { email, password },
      { requiresAuth: false }
    );

    if (response.success && response.data) {
      const { accessToken, refreshToken } = response.data;
      TokenService.setTokens(accessToken, refreshToken);
    }

    return response;
  },

  // 회원가입
  register: async (userData: { email: string; password: string }) => {
    const response = await apiClient.post<LoginResponse>(
      '/auth/signup',
      userData,
      { requiresAuth: false }
    );

    return response;
  },

  // 이메일 인증 요청
  verifyEmail: async (email: string) => {
    const response = await apiClient.post<any>(
      '/auth/verifications',
      { email },
      { requiresAuth: false }
    );

    return response;
  },

  // 로그아웃
  logout: () => {
    TokenService.removeTokens();
    return { success: true };
  },

  // 현재 사용자 정보 조회
  getCurrentUser: async () => {
    const response = await apiClient.get<User>('/auth/me');
    return response;
  },
};

export default AuthService;
