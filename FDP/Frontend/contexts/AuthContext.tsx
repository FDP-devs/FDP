import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/router';
import { AuthService } from '../services/authService';
import { TokenService } from '../services/tokenService';
import { AuthState } from '../types/auth';

// 인증 컨텍스트 타입 정의
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

// 기본 인증 상태
const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
};

// 인증 컨텍스트 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 인증 컨텍스트 제공자 컴포넌트
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const router = useRouter();

  // 초기 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (TokenService.isAuthenticated()) {
          const user = await AuthService.getCurrentUser();
          setAuthState({
            isAuthenticated: true,
            user,
            loading: false,
            error: null,
          });
        } else {
          setAuthState({
            ...initialAuthState,
            loading: false,
          });
        }
      } catch (error) {
        console.error('인증 확인 중 오류 발생:', error);
        TokenService.removeTokens();
        setAuthState({
          ...initialAuthState,
          loading: false,
          error: '인증 세션이 만료되었습니다. 다시 로그인해주세요.',
        });
      }
    };

    checkAuth();
  }, []);

  // 로그인
  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const response = await AuthService.login(email, password);
      setAuthState({
        isAuthenticated: true,
        user: response.user,
        loading: false,
        error: null,
      });
      router.push('/dashboard'); // 로그인 후 대시보드로 이동
    } catch (error: any) {
      console.error('로그인 중 오류 발생:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error:
          error.message ||
          '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.',
      }));
      throw error;
    }
  };

  // 회원가입
  const register = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await AuthService.register({ email, password });
      // 회원가입 후 자동 로그인
      await login(email, password);
    } catch (error: any) {
      console.error('회원가입 중 오류 발생:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '회원가입에 실패했습니다. 다시 시도해주세요.',
      }));
      throw error;
    }
  };

  // 로그아웃
  const logout = () => {
    AuthService.logout();
    setAuthState({
      ...initialAuthState,
      loading: false,
    });
    router.push('/login');
  };

  // 컨텍스트 값
  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// 인증 컨텍스트 사용을 위한 훅
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
};

// 인증 필요한 페이지를 위한 HOC
export const withAuth = (Component: React.ComponentType) => {
  const WithAuth: React.FC = props => {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.replace('/login');
      }
    }, [isAuthenticated, loading, router]);

    if (loading) {
      return <div>로딩 중...</div>; // 로딩 컴포넌트로 대체 가능
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };

  return WithAuth;
};

export default AuthContext;
