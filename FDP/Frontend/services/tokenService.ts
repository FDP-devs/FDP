// 토큰 관련 상수
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// 토큰 관리 유틸리티
export const TokenService = {
  getAccessToken: (): string | null => {
    return typeof window !== 'undefined'
      ? localStorage.getItem(ACCESS_TOKEN_KEY)
      : null;
  },

  getRefreshToken: (): string | null => {
    return typeof window !== 'undefined'
      ? localStorage.getItem(REFRESH_TOKEN_KEY)
      : null;
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  removeTokens: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },

  isAuthenticated: (): boolean => {
    return !!TokenService.getAccessToken();
  },
};

export default TokenService;
