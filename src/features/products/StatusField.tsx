import React from 'react';
import type { Product } from '../../types';
import { useI18n } from '../../i18n/useI18n';

interface StatusFieldProps {
  isEditing: boolean;
  status: Product['status'];
  statusLabel: string;
  onStatusChange: (status: Product['status']) => void;
}

const StatusField: React.FC<StatusFieldProps> = ({ isEditing, status, statusLabel, onStatusChange }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.status}</label>
      {isEditing ? (
        <>
          <select
            value={status}
            onChange={e => onStatusChange(e.target.value as Product['status'])}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
          >
            <option value="active">{t.products.detail.active}</option>
            <option value="inactive">{t.products.detail.inactive}</option>
            <option value="draft">{t.products.detail.draft}</option>
          </select>
          <p className="text-xs text-text-muted mt-1">
            {status === 'active' && t.products.detail.statusActiveDescription}
            {status === 'inactive' && t.products.detail.statusInactiveDescription}
            {status === 'draft' && t.products.detail.statusDraftDescription}
          </p>
        </>
      ) : (
        <p className="text-sm text-text-primary py-2">{statusLabel}</p>
      )}
    </div>
  );
};

export default StatusField;
