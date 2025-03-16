import { RefreshTokenResponse } from '../types/auth';
import TokenService from './tokenService';

// API 기본 설정
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// API 요청 타입
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
}

// API 클라이언트 클래스
class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<Response> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // 기본 요청 메서드
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { method = 'GET', headers = {}, body, requiresAuth = true } = options;

    // 요청 헤더 설정
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // 인증 토큰 추가
    if (requiresAuth) {
      const token = TokenService.getAccessToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // 요청 옵션 설정ß
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    // 요청 바디 추가 (GET 요청에는 바디 없음)
    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      // API 요청 실행
      const response = await fetch(
        `${this.baseUrl}${endpoint}`,
        requestOptions
      );

      // 토큰 만료 처리 (401 에러)
      if (response.status === 401 && requiresAuth) {
        const refreshedResponse = await this.handleTokenRefresh<T>(
          endpoint,
          options
        );
        return refreshedResponse;
      }

      // 응답 처리
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `API 요청 실패: ${response.status}`
        );
      }

      // 응답이 비어있는 경우 (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      // JSON 응답 반환
      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('API 요청 오류:', error);
      throw error;
    }
  }

  // 토큰 갱신 처리
  private async handleTokenRefresh<T>(
    endpoint: string,
    options: RequestOptions
  ): Promise<T> {
    try {
      // 이미 진행 중인 토큰 갱신 요청이 있으면 재사용
      if (!this.refreshPromise) {
        const refreshToken = TokenService.getRefreshToken();

        if (!refreshToken) {
          TokenService.removeTokens();
          throw new Error('리프레시 토큰이 없습니다. 다시 로그인해주세요.');
        }

        // 토큰 갱신 요청
        this.refreshPromise = fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }

      // 토큰 갱신 응답 처리
      const response = await this.refreshPromise;
      this.refreshPromise = null;

      if (!response.ok) {
        // 리프레시 토큰도 만료된 경우
        TokenService.removeTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }

      // 새 토큰 저장
      const data = (await response.json()) as RefreshTokenResponse;
      TokenService.setTokens(data.accessToken, data.refreshToken);

      // 원래 요청 재시도
      return this.request<T>(endpoint, {
        ...options,
        requiresAuth: true,
      });
    } catch (error) {
      console.error('토큰 갱신 오류:', error);
      throw error;
    }
  }

  // HTTP 메서드별 래퍼 함수
  public async get<T = any>(
    endpoint: string,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T = any>(
    endpoint: string,
    data?: any,
    options: Omit<RequestOptions, 'method'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data,
    });
  }

  public async put<T = any>(
    endpoint: string,
    data?: any,
    options: Omit<RequestOptions, 'method'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: data });
  }

  public async delete<T = any>(
    endpoint: string,
    options: Omit<RequestOptions, 'method'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// API 클라이언트 인스턴스 생성
export const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;
