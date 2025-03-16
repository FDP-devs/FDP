import { LoginResponse, User } from '../types/auth';
import apiClient from './apiClient';
import TokenService from './tokenService';

// 인증 관련 API 서비스
export const AuthService = {
  // 로그인
  login: async (email: string, password: string) => {
    try {
      const response = await apiClient.post<LoginResponse>(
        '/auth/login',
        { email, password },
        { requiresAuth: false }
      );
      const { accessToken, refreshToken } = response;
      TokenService.setTokens(accessToken, refreshToken);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 회원가입
  register: async (userData: {
    email: string;
    password: string;
    name: string;
  }) => {
    try {
      return await apiClient.post<LoginResponse>('/auth/register', userData, {
        requiresAuth: false,
      });
    } catch (error) {
      throw error;
    }
  },

  // 로그아웃
  logout: () => {
    TokenService.removeTokens();
  },

  // 현재 사용자 정보 조회
  getCurrentUser: async () => {
    try {
      return await apiClient.get<User>('/auth/me');
    } catch (error) {
      throw error;
    }
  },
};

export default AuthService;
