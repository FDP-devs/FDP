import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
}

export default function ModalPortal({ children }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // SSR 대응: 서버사이드에서는 document가 없으므로 null 반환
  if (!mounted) return null;

  // modalRoot가 없다면 생성
  let modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.setAttribute('id', 'modal-root');
    document.body.appendChild(modalRoot);
  }

  // createPortal을 사용하여 모달을 modalRoot에 렌더링
  return createPortal(children, modalRoot);
}
