import React, { useState, useRef, useEffect } from 'react';

export interface AttributeSlot {
  id: string;
  attributeName: string;
  selectedValues: string[];
  /** The "Talla" dimension is edited through TallaDimensionEditor but counts as one slot. */
  isTalla?: boolean;
}

interface AttributeSlotSelectorProps {
  slotIndex: number;
  slot: AttributeSlot;
  availableAttributes: { id: string; name: string; values: string[] }[];
  attributeValuesMap: Record<string, string[]>;
  onUpdateAttribute: (slotIndex: number, attributeName: string) => void;
  onToggleValue: (slotIndex: number, value: string) => void;
  onToggleAll: (slotIndex: number) => void;
  onRemove?: (slotIndex: number) => void;
}

const AttributeSlotSelector: React.FC<AttributeSlotSelectorProps> = ({
  slotIndex,
  slot,
  availableAttributes,
  attributeValuesMap,
  onUpdateAttribute,
  onToggleValue,
  onToggleAll,
  onRemove,
}) => {
  const [showValuesDropdown, setShowValuesDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const values = attributeValuesMap[slot.attributeName] || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowValuesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Atributo {slotIndex + 1}
        </label>
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(slotIndex)}
            title="Quitar atributo"
            aria-label={`Quitar atributo ${slotIndex + 1}`}
            className="p-1 text-text-muted hover:text-error transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex gap-3">
        {/* Attribute selector */}
        <select
          value={slot.attributeName}
          onChange={e => onUpdateAttribute(slotIndex, e.target.value)}
          aria-label={`Atributo ${slotIndex + 1}`}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg text-text-primary bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        >
          <option value="">Seleccionar atributo...</option>
          {availableAttributes.map(attr => (
            <option key={attr.id} value={attr.name}>{attr.name}</option>
          ))}
        </select>

        {/* Values multi-select */}
        {slot.attributeName && (
          <div className="relative flex-1" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowValuesDropdown(!showValuesDropdown)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg text-text-primary bg-white text-left focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              {slot.selectedValues.length === 0
                ? 'Seleccionar valores...'
                : slot.selectedValues.length === values.length
                  ? `Todos (${values.length})`
                  : `${slot.selectedValues.length} de ${values.length} seleccionados`
              }
            </button>
            {showValuesDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-border">
                  <input
                    type="checkbox"
                    checked={values.length > 0 && values.length === slot.selectedValues.length}
                    onChange={() => onToggleAll(slotIndex)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-medium text-text-muted">Seleccionar todos</span>
                </label>
                {values.map(value => (
                  <label key={value} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slot.selectedValues.includes(value)}
                      onChange={() => onToggleValue(slotIndex, value)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-text-primary">{value}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttributeSlotSelector;
