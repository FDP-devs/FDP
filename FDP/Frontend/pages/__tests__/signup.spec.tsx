import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import SignupPage from '../signup';

jest.useFakeTimers();

describe('회원가입 페이지', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  const renderSignupPage = () => {
    return render(<SignupPage />);
  };

  it('회원가입 페이지가 올바르게 렌더링되어야 함', () => {
    renderSignupPage();

    expect(screen.getByText('회원가입')).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('이메일을 입력하세요')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '인증번호 발송' })
    ).toBeInTheDocument();
  });

  it('인증번호 발송 버튼 클릭 시 로딩 상태가 표시되어야 함', async () => {
    renderSignupPage();

    const submitButton = screen.getByRole('button', { name: '인증번호 발송' });

    fireEvent.click(submitButton);

    // 버튼이 비활성화되어야 함
    expect(submitButton).toBeDisabled();

    // 로딩 스피너가 표시되어야 함
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // 타이머 진행
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    // 로딩이 끝나면 버튼이 다시 활성화되어야 함
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('로딩 중에는 이메일 입력이 비활성화되어야 함', async () => {
    renderSignupPage();

    const emailInput = screen.getByLabelText('이메일');
    const submitButton = screen.getByRole('button', { name: '인증번호 발송' });

    fireEvent.click(submitButton);

    expect(emailInput).toBeDisabled();

    // 타이머 진행
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
  });
});
