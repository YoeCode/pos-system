import React, { useState } from 'react';
import type { SizeGroup } from '../../types';
import { useI18n } from '../../i18n/useI18n';

interface TallaDimensionEditorProps {
  values: string[];
  sizeGroups: SizeGroup[];
  sizeGroupId: string;
  onApplyPreset: (groupId: string) => void;
  onAddValue: (value: string) => void;
  onRemoveValue: (value: string) => void;
}

// Edits the values of the "Talla" variant dimension. A size-group preset
// fills the dimension (replace semantics), and sizes can also be typed in one
// by one. Stock and min_stock are entered per generated combination below.
const TallaDimensionEditor: React.FC<TallaDimensionEditorProps> = ({
  values,
  sizeGroups,
  sizeGroupId,
  onApplyPreset,
  onAddValue,
  onRemoveValue,
}) => {
  const [draft, setDraft] = useState('');
  const t = useI18n();

  const commitDraft = () => {
    if (!draft.trim()) return;
    onAddValue(draft);
    setDraft('');
  };

  return (
    <div className="flex flex-col gap-2 pl-6">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-muted">{t.settings.sizeGroups || 'Size Group'}</label>
        <select
          value={sizeGroupId}
          onChange={e => onApplyPreset(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
        >
          <option value="">{t.common.select || 'Select...'}</option>
          {sizeGroups.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
      </div>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map(value => (
            <span
              key={value}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
            >
              {value}
              <button
                type="button"
                onClick={() => onRemoveValue(value)}
                aria-label={`${t.products.detail.removeSize}: ${value}`}
                className="hover:text-error transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Talla"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitDraft();
            }
          }}
          className="flex-1 px-2 py-2 text-sm border border-border rounded text-text-primary font-mono"
        />
        <button
          type="button"
          onClick={commitDraft}
          className="text-xs text-primary hover:underline whitespace-nowrap"
        >
          {t.products.detail.addSize}
        </button>
      </div>
    </div>
  );
};

export default TallaDimensionEditor;
