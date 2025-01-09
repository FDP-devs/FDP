import { createContext, useContext, useState, ReactNode } from 'react';
import { ModalPortal } from '@/components/common/Modal';
import { LoginModal } from '@/components/modals/LoginModal';

// 모달 타입 정의
type ModalType = 'LoginModal';

interface ModalState {
  isOpen: boolean;
  props?: any;
}

interface ModalContextType {
  openModal: (modalType: ModalType, props?: any) => void;
  closeModal: (modalType: ModalType) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

// 모달 컴포넌트 매핑
const MODAL_COMPONENTS = {
  LoginModal: LoginModal,
  // 다른 모달들도 여기에 추가
};

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<Record<ModalType, ModalState>>({
    LoginModal: { isOpen: false },
  });

  const openModal = (modalType: ModalType, props?: any) => {
    setModals(prev => ({
      ...prev,
      [modalType]: { isOpen: true, props },
    }));
  };

  const closeModal = (modalType: ModalType) => {
    setModals(prev => ({
      ...prev,
      [modalType]: { isOpen: false, props: undefined },
    }));
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {Object.entries(modals).map(([modalType, modalState]) => {
        if (!modalState.isOpen) return null;

        const ModalComponent =
          MODAL_COMPONENTS[modalType as keyof typeof MODAL_COMPONENTS];
        if (!ModalComponent) return null;

        return (
          <ModalPortal key={modalType}>
            <ModalComponent
              isOpen={modalState.isOpen}
              onClose={() => closeModal(modalType as ModalType)}
              {...modalState.props}
            />
          </ModalPortal>
        );
      })}
    </ModalContext.Provider>
  );
}

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
};
