import React, { useState } from 'react';
import { Shield, CheckCircle } from 'lucide-react';
import PINPad from './PINPad';
import { useSetWalletPIN } from '../hooks/useQueries';
import { toast } from 'sonner';

interface WalletPINSetupProps {
  onComplete: () => void;
}

export default function WalletPINSetup({ onComplete }: WalletPINSetupProps) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [pinError, setPinError] = useState('');
  const setWalletPIN = useSetWalletPIN();

  const handleFirstPin = (pin: string) => {
    setFirstPin(pin);
    setPinError('');
    setStep('confirm');
  };

  const handleConfirmPin = async (pin: string) => {
    if (pin !== firstPin) {
      setPinError('PINs do not match. Please try again.');
      setStep('enter');
      setFirstPin('');
      return;
    }
    try {
      await setWalletPIN.mutateAsync({ pin });
      toast.success('Wallet PIN set successfully!');
      onComplete();
    } catch {
      toast.error('Failed to set PIN. Please try again.');
      setStep('enter');
      setFirstPin('');
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4">
      <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
        <Shield size={28} className="text-primary" />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold">Set Wallet PIN</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {step === 'enter'
            ? 'Create a 4-digit PIN to secure your wallet'
            : 'Re-enter your PIN to confirm'}
        </p>
      </div>

      <div className="w-full bg-muted/40 rounded-2xl p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground text-sm flex items-center gap-2">
          <CheckCircle size={14} className="text-success" /> PIN Security
        </p>
        <p>• Your PIN is required every time you open the wallet</p>
        <p>• Never share your PIN with anyone</p>
        <p>• If you forget your PIN, you'll need to re-setup your wallet</p>
      </div>

      <PINPad
        onComplete={step === 'enter' ? handleFirstPin : handleConfirmPin}
        label={step === 'enter' ? 'Enter a 4-digit PIN' : 'Confirm your PIN'}
        error={pinError}
        disabled={setWalletPIN.isPending}
      />
    </div>
  );
}
