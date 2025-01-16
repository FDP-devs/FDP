import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../index';

describe('Modal 컴포넌트', () => {
  const mockOnClose = jest.fn();

  const renderModal = (isOpen: boolean = true) => {
    return render(
      <Modal isOpen={isOpen} onClose={mockOnClose}>
        <div>모달 내용</div>
      </Modal>
    );
  };

  beforeEach(() => {
    // 각 테스트 전에 mock 함수 초기화
    mockOnClose.mockClear();
  });

  it('isOpen이 true일 때 모달이 렌더링되어야 함', () => {
    renderModal(true);
    expect(screen.getByText('모달 내용')).toBeInTheDocument();
  });

  it('isOpen이 false일 때 모달이 렌더링되지 않아야 함', () => {
    renderModal(false);
    expect(screen.queryByText('모달 내용')).not.toBeInTheDocument();
  });

  it('배경을 클릭하면 onClose가 호출되어야 함', () => {
    renderModal();
    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
