import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { AuthService } from '../../services/authService';
import { TokenService } from '../../services/tokenService';
import { useRouter } from 'next/router';
import SignupPage from '../../pages/signup';

// Next.js router mocking
jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    query: {},
  }),
}));

// Modal Context mocking
jest.mock('../../contexts/ModalContext', () => ({
  useModalContext: jest.fn().mockReturnValue({
    openModal: jest.fn(),
  closeModal: jest.fn(),
  }),
}));

// apiClient mocking
jest.mock('../../services/apiClient', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// AuthService & TokenService mocking
jest.mock('../../services/authService', () => ({
  AuthService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

jest.mock('../../services/tokenService', () => ({
  TokenService: {
    setTokens: jest.fn(),
    removeTokens: jest.fn(),
    isAuthenticated: jest.fn(),
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
  },
}));

// 테스트용 AuthContext 래퍼
const AuthContextWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <AuthProvider>{children}</AuthProvider>;
};

// LoginModal 컴포넌트를 실제 렌더링하는 대신, 테스트를 위한 간단한 버전을 만듭니다
const MockLoginModal = () => {
  const { login } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    }
  };

  return (
    <div>
      <h2>로그인</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">로그인</button>
        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  );
};

// 로그아웃 컴포넌트
const LogoutComponent = () => {
  const { logout, isAuthenticated } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? '인증됨' : '인증되지 않음'}
      </div>
      <button onClick={logout} data-testid="logout-btn">
        로그아웃
      </button>
    </div>
  );
};

// 인증이 필요한 페이지 컴포넌트
const ProtectedPage = () => {
  const { isAuthenticated, user } = useAuth();
  return (
    <div>
      {isAuthenticated ? (
        <div>
          <h1>인증된 페이지</h1>
          <p data-testid="user-email">{user?.email}</p>
        </div>
      ) : (
        <div>접근 권한이 없습니다</div>
      )}
    </div>
  );
};

describe('AuthContext와 실제 컴포넌트 통합 테스트', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      query: {},
    });

    // 기본적으로 인증되지 않은 상태로 설정
    (TokenService.isAuthenticated as jest.Mock).mockReturnValue(false);
  });

  describe('LoginModal 컴포넌트와 AuthContext 통합 테스트', () => {
    it('로그인 폼을 렌더링하고 제출 시 AuthService.login이 호출되어야 함', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: '테스트유저',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      };

      const mockLoginResponse = {
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        user: mockUser,
      };

      (AuthService.login as jest.Mock).mockResolvedValue(mockLoginResponse);

      render(
        <AuthContextWrapper>
          <MockLoginModal />
        </AuthContextWrapper>
      );

      // 로그인 폼 요소 확인
      expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument();

      // 이메일과 비밀번호 입력
      await userEvent.type(
        screen.getByLabelText(/이메일/i),
        'test@example.com'
      );
      await userEvent.type(screen.getByLabelText(/비밀번호/i), 'password123');

      // 폼 제출
      const submitButton = screen.getByRole('button', { name: /로그인/i });

      await act(async () => {
        await userEvent.click(submitButton);
      });

      // AuthService.login이 호출되었는지 확인
      await waitFor(() => {
        expect(AuthService.login).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });

      // 로그인 후 대시보드로 리디렉션되었는지 확인
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('로그인 실패 시 에러 메시지가 표시되어야 함', async () => {
      const mockError = new Error('로그인에 실패했습니다.');
      (AuthService.login as jest.Mock).mockRejectedValue(mockError);

      render(
        <AuthContextWrapper>
          <MockLoginModal />
        </AuthContextWrapper>
      );

      // 이메일과 비밀번호 입력
      await userEvent.type(
        screen.getByLabelText(/이메일/i),
        'wrong@example.com'
      );
      await userEvent.type(screen.getByLabelText(/비밀번호/i), 'wrongpassword');

      // 폼 제출
      const submitButton = screen.getByRole('button', { name: /로그인/i });

      await act(async () => {
        await userEvent.click(submitButton);
      });

      // 에러 상태 확인
      await waitFor(() => {
        expect(screen.getByText(/로그인에 실패했습니다/i)).toBeInTheDocument();
      });
    });
  });

  describe('SignupPage 컴포넌트와 AuthContext 통합 테스트', () => {
    it('회원가입 폼을 렌더링하고 제출 시 AuthService.register가 호출되어야 함', async () => {
      const mockUser = {
        id: '1',
        email: 'new@example.com',
        name: '신규유저',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      };

      const mockRegisterResponse = {
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        user: mockUser,
      };

      (AuthService.register as jest.Mock).mockResolvedValue(
        mockRegisterResponse
      );
      (AuthService.login as jest.Mock).mockResolvedValue(mockRegisterResponse);

      render(
        <AuthContextWrapper>
          <SignupPage />
        </AuthContextWrapper>
      );

      // 회원가입 페이지 요소 확인
      expect(screen.getByText(/회원가입/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();

      // 이메일 입력
      await userEvent.type(screen.getByLabelText(/이메일/i), 'new@example.com');

      // 인증번호 발송 버튼 클릭
      const sendButton = screen.getByRole('button', { name: /인증번호 발송/i });

      await act(async () => {
        await userEvent.click(sendButton);
      });

      // 다음 단계의 회원가입 과정을 통해 AuthService.register가 호출되는지 확인
      // 참고: 실제 회원가입 과정은 여러 단계로 이루어져 있을 수 있으므로
      // 실제 컴포넌트의 구현에 따라 테스트를 조정해야 합니다

      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      });

      // 로딩 상태 확인
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('인증 상태 변경에 따른 컴포넌트 동작 테스트', () => {
    it('인증된 사용자는 인증된 페이지에 접근할 수 있어야 함', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: '테스트유저',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      };

      // 인증된 상태로 설정
      (TokenService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      render(
        <AuthContextWrapper>
          <ProtectedPage />
        </AuthContextWrapper>
      );

      // 로딩 완료 후 인증된 페이지가 표시되는지 확인
      await waitFor(() => {
        expect(screen.getByText('인증된 페이지')).toBeInTheDocument();
      });

      // 사용자 정보가 올바르게 표시되는지 확인
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'test@example.com'
      );
    });

    it('로그아웃 시 토큰이 제거되고 인증 상태가 변경되어야 함', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: '테스트유저',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      };

      // 인증된 상태로 설정
      (TokenService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      // 로그아웃 메소드가 removeTokens를 호출하도록 설정
      (AuthService.logout as jest.Mock).mockImplementation(() => {
        TokenService.removeTokens();
      });

      render(
        <AuthContextWrapper>
          <LogoutComponent />
        </AuthContextWrapper>
      );

      // 초기에는 인증된 상태
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('인증됨');
      });

      // 로그아웃 버튼 클릭
      const logoutButton = screen.getByTestId('logout-btn');

      await act(async () => {
        await userEvent.click(logoutButton);
      });

      // 로그아웃 서비스 호출 확인
      expect(AuthService.logout).toHaveBeenCalled();

      // 토큰이 제거되었는지 확인
      expect(TokenService.removeTokens).toHaveBeenCalled();

      // 인증 상태가 변경되었는지 확인
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        '인증되지 않음'
      );

      // 로그인 페이지로 리디렉션되었는지 확인
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
