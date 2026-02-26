import React, { useState } from 'react';
import { Lock, HelpCircle } from 'lucide-react';
import PINPad from './PINPad';
import { useVerifyWalletPIN } from '../hooks/useQueries';

interface WalletPINVerifyProps {
  onVerified: () => void;
}

export default function WalletPINVerify({ onVerified }: WalletPINVerifyProps) {
  const [pinError, setPinError] = useState('');
  const verifyPIN = useVerifyWalletPIN();

  const handlePinComplete = async (pin: string) => {
    setPinError('');
    try {
      const isValid = await verifyPIN.mutateAsync({ pin });
      if (isValid) {
        onVerified();
      } else {
        setPinError('Incorrect PIN. Please try again.');
      }
    } catch {
      setPinError('Verification failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4">
      <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
        <Lock size={28} className="text-primary" />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold">Enter Wallet PIN</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your 4-digit PIN to access your wallet
        </p>
      </div>

      <PINPad
        onComplete={handlePinComplete}
        label="Enter your PIN"
        error={pinError}
        disabled={verifyPIN.isPending}
      />

      <div className="flex items-start gap-2 bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground w-full">
        <HelpCircle size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
        <p>
          <span className="font-semibold text-foreground">Forgot PIN?</span> If you've forgotten your PIN,
          you'll need to contact support or re-onboard your wallet. For security, PINs cannot be recovered.
        </p>
      </div>
    </div>
  );
}
