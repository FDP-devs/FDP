import React from 'react';

export default function SignupPage() {
  return (
    <main className="neon-container h-screen w-screen overflow-hidden">
      <article className="flex w-full h-full flex-col items-center justify-center px-4">
        <section className="w-[400px] rounded-lg bg-[--color-background-secondary] p-8 shadow-lg">
          <h1 className="mb-6 text-2xl font-bold text-[--color-text] text-center">
            회원가입
          </h1>

          <form className="space-y-4">
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
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-[--color-primary] py-2 text-white transition-all hover:opacity-90"
            >
              인증번호 발송
            </button>
          </form>
        </section>
      </article>
    </main>
  );
}
