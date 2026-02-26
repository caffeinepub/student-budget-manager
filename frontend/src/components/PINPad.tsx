import React, { useState } from 'react';
import { Delete } from 'lucide-react';

interface PINPadProps {
  onComplete: (pin: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export default function PINPad({ onComplete, label, error, disabled }: PINPadProps) {
  const [pin, setPin] = useState('');

  const handleDigit = (digit: string) => {
    if (disabled) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) {
      onComplete(newPin);
      setPin('');
    }
  };

  const handleBackspace = () => {
    if (disabled) return;
    setPin(prev => prev.slice(0, -1));
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="flex flex-col items-center gap-6">
      {label && (
        <p className="text-sm font-medium text-muted-foreground text-center">{label}</p>
      )}

      {/* PIN dots */}
      <div className="flex items-center gap-4">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              i < pin.length
                ? 'bg-primary border-primary scale-110'
                : 'bg-transparent border-muted-foreground/40'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-xs text-destructive font-medium text-center">{error}</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        {digits.map((d, idx) => {
          if (d === '') {
            return <div key={idx} />;
          }
          if (d === 'del') {
            return (
              <button
                key={idx}
                onClick={handleBackspace}
                disabled={disabled || pin.length === 0}
                className="h-16 rounded-2xl bg-muted/60 flex items-center justify-center text-foreground font-semibold text-lg active:scale-95 transition-transform disabled:opacity-40 touch-target"
              >
                <Delete size={20} />
              </button>
            );
          }
          return (
            <button
              key={idx}
              onClick={() => handleDigit(d)}
              disabled={disabled || pin.length >= 4}
              className="h-16 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-center text-foreground font-bold text-xl active:scale-95 transition-transform disabled:opacity-40 touch-target hover:bg-muted/30"
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
