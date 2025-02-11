// LoginModal에서 Modal 컴포넌트 사용
import { Modal } from '@components/common/Modal';
import { ModalProps } from '@/types/modal';
import { useRouter } from 'next/router';

export default function LoginModal({ isOpen, onClose }: ModalProps) {
  const router = useRouter();

  const handleSignupClick = () => {
    onClose();
    router.push('/signup');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-[400px] p-6">
        <h2 className="mb-6 text-2xl font-bold text-[--color-text]">로그인</h2>

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

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[--color-text-secondary]"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-md border border-[--color-border] bg-[--color-gray] p-2 text-[--color-text] focus:border-[--color-primary] focus:outline-none"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-[--color-border] bg-[--color-gray] text-[--color-primary]"
              />
              <label
                htmlFor="remember"
                className="ml-2 text-sm text-[--color-text-light]"
              >
                로그인 상태 유지
              </label>
            </div>
            <button
              type="button"
              className="text-sm text-[--color-text-light] hover:text-[--color-primary]"
            >
              비밀번호 찾기
            </button>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-[--color-primary] py-2 text-white transition-all hover:opacity-90"
          >
            로그인
          </button>

          <div className="text-center">
            <span className="text-sm text-[--color-text-light]">
              계정이 없으신가요?{' '}
              <button
                type="button"
                className="text-[--color-secondary] hover:underline"
                onClick={handleSignupClick}
              >
                회원가입
              </button>
            </span>
          </div>
        </form>
      </div>
    </Modal>
  );
}
