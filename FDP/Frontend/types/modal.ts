export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export interface ModalContextType {
  openModal: (modalType: string, props?: any) => void;
  closeModal: (modalType: string) => void;
}
