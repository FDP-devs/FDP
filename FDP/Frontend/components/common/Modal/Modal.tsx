import { ModalProps } from '@/types/modal';

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 블러 효과 */}
      <div
        className="fixed inset-0 backdrop-blur-sm bg-black/30"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="relative z-50 min-w-[320px] rounded-lg bg-[--color-background-secondary] p-6 shadow-lg">
        {/* 실제 모달 내용 */}
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
