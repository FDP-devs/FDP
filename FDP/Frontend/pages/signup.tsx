import React, { useState, useRef } from 'react';
import { AuthService } from '@/services/authService';
import { useRouter } from 'next/router';

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    // 초기화
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // 이메일, 비밀번호 유효성 검사
      const email = emailRef.current?.value || '';
      const password = passwordRef.current?.value || '';

      if (!email) {
        setErrorMessage('이메일을 입력해주세요.');
        setIsLoading(false);
        return;
      }

      if (!password) {
        setErrorMessage('비밀번호를 입력해주세요.');
        setIsLoading(false);
        return;
      }

      if (password.length < 8) {
        setErrorMessage('비밀번호는 8자 이상이어야 합니다.');
        setIsLoading(false);
        return;
      }

      // API 호출
      const response = await AuthService.register({
        email,
        password,
      });

      // 응답 처리
      if (response.success && response.data) {
        setSuccessMessage(
          '회원가입이 완료되었습니다. 곧 로그인 페이지로 이동합니다.'
        );

        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push('/login?registered=true');
        }, 3000);
      } else {
        // 에러 메시지 처리
        const errorMsg = response.error?.message || '회원가입에 실패했습니다.';

        // 특정 에러 메시지에 대한 사용자 친화적인 메시지 설정
        if (errorMsg.includes('이미 가입된 이메일')) {
          setErrorMessage('이미 가입된 이메일입니다.');
        } else if (errorMsg.includes('탈퇴한 이메일')) {
          setErrorMessage(
            '탈퇴한 계정의 이메일입니다. 고객센터에 문의해주세요.'
          );
        } else {
          setErrorMessage(errorMsg);
        }
      }
    } catch (error: any) {
      console.error('예상치 못한 오류:', error);
      setErrorMessage('일시적인 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="neon-container h-screen w-screen overflow-hidden">
      <article className="flex w-full h-full flex-col items-center justify-center px-4">
        <section className="w-[400px] rounded-lg bg-[--color-background-secondary] p-8 shadow-lg flex flex-col gap-2">
          <h1 className="mb-6 text-2xl font-bold text-[--color-text] text-center">
            회원가입
          </h1>

          {errorMessage && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
              {successMessage}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[--color-text-secondary]"
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              ref={emailRef}
              className="w-full rounded-md border border-[--color-border] bg-[--color-gray] p-2 text-[--color-text] focus:border-[--color-primary] focus:outline-none"
              placeholder="이메일을 입력하세요"
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[--color-text-secondary]"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              ref={passwordRef}
              className="w-full rounded-md border border-[--color-border] bg-[--color-gray] p-2 text-[--color-text] focus:border-[--color-primary] focus:outline-none"
              placeholder="비밀번호를 입력하세요"
              disabled={isLoading}
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="relative w-full rounded-md bg-[--color-primary] py-2 text-white transition-all hover:opacity-90 disabled:opacity-50 mt-4"
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '회원가입'}
          </button>
        </section>
      </article>
    </main>
  );
}
