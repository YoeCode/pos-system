import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../../components/ui/Modal';
import PaymentStep from './PaymentStep';
import ReceiptStep from './ReceiptStep';
import { useI18n } from '../../../i18n/useI18n';
import type { CartItem, PaymentMethod } from '../../../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  orderNumber: string;
  customerId?: string;
  discountApplied: number;
  pointsToRedeem?: number;
  isGiftReceipt?: boolean;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  subtotal,
  tax,
  total,
  paymentMethod,
  orderNumber,
  customerId,
  discountApplied,
  pointsToRedeem = 0,
  isGiftReceipt = false,
}) => {
  const [step, setStep] = useState<'payment' | 'success' | 'receipt'>('payment');
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);
  const [loyaltyPointsEarned, setLoyaltyPointsEarned] = useState(0);
  const [successTotal, setSuccessTotal] = useState(0);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const confirmedOrderNumber = orderNumber;

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const handleComplete = (saleId: string, pointsEarned: number) => {
    setCompletedSaleId(saleId);
    setLoyaltyPointsEarned(pointsEarned);
    setSuccessTotal(total);
    setStep('success');
    successTimerRef.current = setTimeout(() => {
      setStep('receipt');
    }, 1800);
  };

  const handleClose = () => {
    setStep('payment');
    setCompletedSaleId(null);
    setLoyaltyPointsEarned(0);
    onClose();
  };

  const t = useI18n();
  const title = step === 'payment' ? t.pos.confirmPayment : step === 'success' ? t.pos.saleCompleted : t.pos.receipt;
  const subtitle = step === 'success' ? undefined : confirmedOrderNumber || orderNumber;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} subtitle={subtitle}>
      {step === 'payment' ? (
        <PaymentStep
          cart={cart}
          subtotal={subtotal}
          tax={tax}
          total={total}
          paymentMethod={paymentMethod}
          orderNumber={confirmedOrderNumber || orderNumber}
          customerId={customerId}
          discountApplied={discountApplied}
          pointsToRedeem={pointsToRedeem}
          onComplete={handleComplete}
        />
      ) : step === 'success' ? (
        <div className="flex flex-col items-center justify-center py-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${20 + (i * 5)}%`,
                  top: '30%',
                  backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5],
                  animation: `confetti 1s ease-out ${i * 0.08}s forwards`,
                }}
              />
            ))}
          </div>
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4" style={{ animation: 'bounce-in 0.5s ease-out' }}>
            <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xl font-bold text-text-primary mb-1">{t.pos.saleCompleted}</p>
          <p className="text-3xl font-mono font-bold text-success mb-2">€{successTotal.toFixed(2)}</p>
          <p className="text-xs text-text-muted font-medium bg-gray-50 px-3 py-1 rounded-full mb-4">
            {t.pos.orderNumber}{confirmedOrderNumber || orderNumber}
          </p>
          <p className="text-xs text-text-muted">{t.pos.preparingReceipt}</p>
        </div>
      ) : (
        completedSaleId && (
          <ReceiptStep
            saleId={completedSaleId}
            loyaltyPointsEarned={loyaltyPointsEarned}
            onDone={handleClose}
            isGiftReceipt={isGiftReceipt}
          />
        )
      )}
    </Modal>
  );
};

export default CheckoutModal;
