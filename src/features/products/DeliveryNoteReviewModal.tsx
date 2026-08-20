import React, { useState, useMemo, useLayoutEffect } from 'react';
import { useAppSelector } from '../../app/store';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Fuse from 'fuse.js';
import type { Product } from '../../types';
import type { ParsedDeliveryItem, ParsedDeliveryNote } from './deliveryNoteService';
import { suggestCategory } from './deliveryNoteService';
import { selectCategories } from '../../features/settings/settingsSlice';

export interface DeliveryAction {
  type: 'restock' | 'create';
  parsedItem: ParsedDeliveryItem;
  matchedProduct?: Product;
  quantity: number;
  costPrice?: number | null;
}

interface DeliveryNoteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedNote: ParsedDeliveryNote | null;
  onConfirm: (actions: DeliveryAction[]) => void;
}

const DeliveryNoteReviewModal: React.FC<DeliveryNoteReviewModalProps> = ({
  isOpen,
  onClose,
  parsedNote,
  onConfirm,
}) => {
  const existingProducts = useAppSelector(state => state.products.items);

  const fuse = useMemo(() => {
    return new Fuse(existingProducts, {
      keys: ['name', 'sku', 'brand'],
      threshold: 0.35,
      includeScore: true,
    });
  }, [existingProducts]);

  const [itemActions, setItemActions] = useState<Record<number, DeliveryAction>>({});
  const [suggestingIdx, setSuggestingIdx] = useState<number | null>(null);
  const [pendingSuggestion, setPendingSuggestion] = useState<Record<number, string>>({});
  const [acceptedCategories, setAcceptedCategories] = useState<Record<number, string>>({});
  const categories = useAppSelector(selectCategories);

  useLayoutEffect(() => {
    if (!parsedNote) return;
    const initial: Record<number, DeliveryAction> = {};
    parsedNote.items.forEach((item, idx) => {
      const bestMatch = fuse
        .search(item.nombre)
        .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))[0];
      const isHighConfidence = bestMatch && (bestMatch.score ?? 1) < 0.2;

      initial[idx] = {
        type: isHighConfidence ? 'restock' : 'create',
        parsedItem: item,
        matchedProduct: isHighConfidence ? bestMatch.item : undefined,
        quantity: item.cantidad,
        costPrice: item.precioCoste,
      };
    });
    setItemActions(initial);
    setPendingSuggestion({});
    setAcceptedCategories({});
    setSuggestingIdx(null);
  }, [parsedNote, fuse]);

  if (!isOpen || !parsedNote || parsedNote.items.length === 0) {
    return null;
  }

  const handleChangeAction = (idx: number, type: 'restock' | 'create') => {
    setItemActions(prev => {
      const current = prev[idx];
      if (!current) return prev;
      const results = fuse.search(current.parsedItem.nombre);
      const bestMatch = results[0];
      return {
        ...prev,
        [idx]: {
          ...current,
          type,
          matchedProduct: type === 'restock' ? bestMatch?.item : undefined,
        },
      };
    });
  };

  const handleQuantityChange = (idx: number, quantity: number) => {
    setItemActions(prev => ({
      ...prev,
      [idx]: prev[idx] ? { ...prev[idx], quantity } : prev[idx],
    }));
  };

  const handleSuggestCategory = async (idx: number) => {
    const item = parsedNote?.items[idx];
    if (!item) return;
    setSuggestingIdx(idx);
    const suggestion = await suggestCategory(item.nombre, categories);
    if (suggestion) {
      setPendingSuggestion(prev => ({ ...prev, [idx]: suggestion }));
    }
    setSuggestingIdx(null);
  };

  const handleAcceptSuggestion = (idx: number) => {
    const suggestion = pendingSuggestion[idx];
    if (!suggestion) return;
    setAcceptedCategories(prev => ({ ...prev, [idx]: suggestion }));
    setPendingSuggestion(prev => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const handleDiscardSuggestion = (idx: number) => {
    setPendingSuggestion(prev => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const handleConfirm = () => {
    const actions = Object.entries(itemActions).map(([idx, action]) => ({
      ...action,
      parsedItem: {
        ...action.parsedItem,
        categoria: acceptedCategories[Number(idx)] || action.parsedItem.categoria,
      },
    }));
    onConfirm(actions);
  };

  const restockCount = Object.values(itemActions).filter(a => a.type === 'restock').length;
  const createCount = Object.values(itemActions).filter(a => a.type === 'create').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Delivery Note"
      subtitle={`${parsedNote.proveedor || 'Unknown supplier'} · ${parsedNote.fecha || 'No date'} · ${parsedNote.numeroAlbaran || 'No reference'}`}
    >
      <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
        {parsedNote.items.map((item, idx) => {
          const action = itemActions[idx];
          if (!action) return null;

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-colors ${
                action.type === 'restock'
                  ? 'border-primary/20 bg-primary/5'
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {item.nombre}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {acceptedCategories[idx] ? (
                      <Badge variant="success" className="text-[10px] px-1.5 py-0">{acceptedCategories[idx]}</Badge>
                    ) : item.categoria ? (
                      <Badge variant="info" className="text-[10px] px-1.5 py-0">{item.categoria}</Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px] px-1.5 py-0">Sin categoría</Badge>
                    )}

                    {pendingSuggestion[idx] && (
                      <>
                        <span className="text-[10px] text-text-muted">Sugerencia:</span>
                        <Badge variant="neutral" className="text-[10px] px-1.5 py-0">{pendingSuggestion[idx]}</Badge>
                        <button
                          onClick={() => handleAcceptSuggestion(idx)}
                          className="text-[10px] text-primary hover:text-primary-dark font-medium transition-colors"
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => handleDiscardSuggestion(idx)}
                          className="text-[10px] text-text-muted hover:text-error font-medium transition-colors"
                        >
                          Descartar
                        </button>
                      </>
                    )}

                    {!item.categoria && !acceptedCategories[idx] && !pendingSuggestion[idx] && (
                      <button
                        onClick={() => handleSuggestCategory(idx)}
                        disabled={suggestingIdx === idx}
                        className="text-[10px] text-primary hover:text-primary-dark font-medium transition-colors disabled:opacity-50"
                      >
                        {suggestingIdx === idx ? 'Analizando...' : 'Sugerir con IA'}
                      </button>
                    )}

                    {item.marca && (
                      <span className="text-xs text-text-muted">{item.marca}</span>
                    )}
                    {item.referenciaProveedor && (
                      <span className="text-xs font-mono text-text-muted">
                        Ref: {item.referenciaProveedor}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={action.type === 'restock' ? 'success' : 'warning'}>
                    {action.type === 'restock' ? 'Restock' : 'New'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={action.quantity}
                    onChange={e => handleQuantityChange(idx, parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1.5 text-sm border border-border rounded text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Cost
                  </label>
                  <span className="text-sm font-mono text-text-primary py-1.5">
                    {item.precioCoste !== null ? `€${item.precioCoste.toFixed(2)}` : '—'}
                  </span>
                </div>
                {action.type === 'restock' && action.matchedProduct && (
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                      Matched To
                    </label>
                    <span className="text-xs text-primary truncate">
                      {action.matchedProduct.name} ({action.matchedProduct.stock} in stock)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => handleChangeAction(idx, 'restock')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    action.type === 'restock'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                  }`}
                >
                  Restock Existing
                </button>
                <button
                  onClick={() => handleChangeAction(idx, 'create')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    action.type === 'create'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                  }`}
                >
                  Create New
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {restockCount} restock
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {createCount} new
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeliveryNoteReviewModal;
