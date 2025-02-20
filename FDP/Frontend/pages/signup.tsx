import React, { useState } from 'react';

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: API 호출 로직 추가
      await new Promise(resolve => setTimeout(resolve, 2000)); // 임시 딜레이
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="neon-container h-screen w-screen overflow-hidden">
      <article className="flex w-full h-full flex-col items-center justify-center px-4">
        <section className="w-[400px] rounded-lg bg-[--color-background-secondary] p-8 shadow-lg">
          <h1 className="mb-6 text-2xl font-bold text-[--color-text] text-center">
            회원가입
          </h1>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[--color-text-secondary]"
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-md border border-[--color-border] bg-[--color-gray] p-2 text-[--color-text] focus:border-[--color-primary] focus:outline-none"
              placeholder="이메일을 입력하세요"
              disabled={isLoading}
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="relative w-full rounded-md bg-[--color-primary] py-2 text-white transition-all hover:opacity-90 disabled:opacity-50 mt-4"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="opacity-0">인증번호 발송</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              </>
            ) : (
              '인증번호 발송'
            )}
          </button>
        </section>
      </article>
    </main>
  );
}
