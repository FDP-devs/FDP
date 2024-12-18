import React from 'react';

export default function LandingPage() {
  return (
    <main className="neon-container h-screen w-screen overflow-hidden">
      <article className="flex w-full h-full flex-col items-center justify-center px-4">
        <section className="text-center">
          <h1 className="mb-8 text-6xl font-bold text-[--color-primary] drop-shadow-lg">
            Frontend Deploy Platform
          </h1>
          <p className="mb-10 text-xl text-[--color-text-primary]">
            프론트엔드 배포 플랫폼을 더 스마트하게
          </p>
          <button className="rounded-lg bg-[--color-primary] px-8 py-3 text-white transition-all hover:opacity-90 drop-shadow-lg">
            시작하기
          </button>
        </section>
      </article>
    </main>
  );
}
