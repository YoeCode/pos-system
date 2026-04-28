import React, { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import PaymentStep from './PaymentStep';
import ReceiptStep from './ReceiptStep';
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
}) => {
  const [step, setStep] = useState<'payment' | 'receipt'>('payment');
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);
  const [loyaltyPointsEarned, setLoyaltyPointsEarned] = useState(0);

  const handleComplete = (saleId: string, pointsEarned: number) => {
    setConfirmedOrderNumber(orderNumber);
    setCompletedSaleId(saleId);
    setLoyaltyPointsEarned(pointsEarned);
    setStep('receipt');
  };

  const handleClose = () => {
    setStep('payment');
    setCompletedSaleId(null);
    setConfirmedOrderNumber(null);
    setLoyaltyPointsEarned(0);
    onClose();
  };

  const title = step === 'payment' ? 'Confirm Payment' : 'Receipt';
  const subtitle = step === 'receipt' && confirmedOrderNumber ? confirmedOrderNumber : orderNumber;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} subtitle={subtitle}>
      {step === 'payment' ? (
        <PaymentStep
          cart={cart}
          subtotal={subtotal}
          tax={tax}
          total={total}
          paymentMethod={paymentMethod}
          orderNumber={orderNumber}
          customerId={customerId}
          discountApplied={discountApplied}
          onComplete={handleComplete}
        />
      ) : (
        completedSaleId && (
          <ReceiptStep
            saleId={completedSaleId}
            loyaltyPointsEarned={loyaltyPointsEarned}
            onDone={handleClose}
          />
        )
      )}
    </Modal>
  );
};

export default CheckoutModal;
