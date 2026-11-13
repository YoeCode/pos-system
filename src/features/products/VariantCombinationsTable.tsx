import React from 'react';
import { useI18n } from '../../i18n/useI18n';

export interface VariantCombination {
  attributes: Record<string, string>;
  stock: number;
  minStock: number;
}

interface VariantCombinationsTableProps {
  combinations: VariantCombination[];
  dimensionNames: string[];
  onChange: (index: number, next: VariantCombination) => void;
}

const VariantCombinationsTable: React.FC<VariantCombinationsTableProps> = ({
  combinations,
  dimensionNames,
  onChange,
}) => {
  const t = useI18n();
  if (combinations.length === 0) return null;

  const totalStock = combinations.reduce((sum, c) => sum + c.stock, 0);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-border">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          {t.products.combinations.title.replace('{{count}}', String(combinations.length))}
        </p>
      </div>
      <div className="max-h-60 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {dimensionNames.map(name => (
                <th key={name} className="px-3 py-2 text-left text-xs font-semibold text-text-muted uppercase">
                  {name}
                </th>
              ))}
              <th className="px-3 py-2 text-right text-xs font-semibold text-text-muted uppercase w-20">
                {t.products.stock}
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-text-muted uppercase w-20">
                {t.products.detail.min}
              </th>
            </tr>
          </thead>
          <tbody>
            {combinations.map((combo, idx) => (
              <tr key={idx} className="border-b border-border last:border-b-0">
                {dimensionNames.map(name => (
                  <td key={name} className="px-3 py-2 text-text-primary">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                      {combo.attributes[name]}
                    </span>
                  </td>
                ))}
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    value={combo.stock}
                    onChange={e => onChange(idx, { ...combo, stock: parseInt(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 text-xs border border-border rounded text-text-primary font-mono text-right"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    value={combo.minStock}
                    onChange={e => onChange(idx, { ...combo, minStock: parseInt(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 text-xs border border-border rounded text-text-primary font-mono text-right"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 bg-gray-50 border-t border-border">
        <p className="text-xs text-text-muted">
          {t.products.combinations.total.replace('{{count}}', String(totalStock))}
        </p>
      </div>
    </div>
  );
};

export default VariantCombinationsTable;
