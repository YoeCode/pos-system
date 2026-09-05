import React from 'react';
import { useI18n } from '../../i18n/useI18n';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  const t = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
        <h4 className="text-lg font-semibold text-text-primary mb-2">{t.products.detail.deleteTitle}</h4>
        <p className="text-sm text-text-muted mb-6">
          {t.products.detail.deleteConfirmMessage}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t.products.detail.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-error rounded-lg hover:bg-red-600 transition-colors"
          >
            {t.products.detail.deleteButton}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
