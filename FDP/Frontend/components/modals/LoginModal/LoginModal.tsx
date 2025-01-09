// LoginModal에서 Modal 컴포넌트 사용
import { Modal } from '@components/common/Modal';
import { ModalProps } from '@/types/modal';

export default function LoginModal({ isOpen, onClose }: ModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>로그인 폼 내용</div>
    </Modal>
  );
}
