import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useSendFundsFromWallet } from '../hooks/useQueries';
import { Send, Loader2, User, IndianRupee, FileText, QrCode } from 'lucide-react';

interface SendMoneyFormProps {
  open: boolean;
  onClose: () => void;
  prefillRecipient?: string;
  walletBalance: number;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function SendMoneyForm({
  open,
  onClose,
  prefillRecipient = '',
  walletBalance,
}: SendMoneyFormProps) {
  const [recipient, setRecipient] = useState(prefillRecipient);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const sendFunds = useSendFundsFromWallet();

  // Update recipient when prefill changes
  useEffect(() => {
    if (prefillRecipient) {
      setRecipient(prefillRecipient);
    }
  }, [prefillRecipient]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setAmount('');
      setNote('');
      if (!prefillRecipient) setRecipient('');
    }
  }, [open, prefillRecipient]);

  const parsedAmount = parseFloat(amount);
  const isAmountValid = !isNaN(parsedAmount) && parsedAmount > 0;
  const isOverBalance = isAmountValid && parsedAmount > walletBalance;
  const canSubmit = recipient.trim().length > 0 && isAmountValid && !isOverBalance && !sendFunds.isPending;

  const handleSend = async () => {
    if (!canSubmit) return;

    try {
      await sendFunds.mutateAsync({
        recipient: recipient.trim(),
        amount: parsedAmount,
        note: note.trim(),
      });
      toast.success(`₹${formatINR(parsedAmount)} sent to ${recipient.trim()}!`);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send funds';
      if (msg.includes('Insufficient') || msg.includes('insufficient')) {
        toast.error('Insufficient wallet balance');
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[380px] mx-auto rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
        {/* Header */}
        <div className="gradient-primary px-6 pt-6 pb-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 -translate-y-6 translate-x-6" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
              <Send size={20} />
            </div>
            <DialogHeader>
              <DialogTitle className="text-white text-lg font-bold">Send Money</DialogTitle>
            </DialogHeader>
            <p className="text-white/70 text-xs mt-1">
              Balance: ₹{formatINR(walletBalance)}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card px-5 py-5 space-y-4">
          {/* Recipient */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <User size={11} />
              Recipient
            </Label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter name or payment ID"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="h-11 rounded-2xl text-sm pl-4 pr-10"
              />
              {prefillRecipient && recipient === prefillRecipient && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <QrCode size={14} className="text-primary" />
                </div>
              )}
            </div>
            {prefillRecipient && recipient === prefillRecipient && (
              <p className="text-[10px] text-primary flex items-center gap-1">
                <QrCode size={10} />
                Filled from QR scan
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <IndianRupee size={11} />
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
                ₹
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 rounded-2xl text-sm pl-8"
                min="1"
                step="0.01"
              />
            </div>
            {isOverBalance && (
              <p className="text-xs text-destructive font-medium">
                Exceeds wallet balance (₹{formatINR(walletBalance)})
              </p>
            )}
            {isAmountValid && !isOverBalance && (
              <p className="text-[10px] text-muted-foreground">
                Remaining after: ₹{formatINR(walletBalance - parsedAmount)}
              </p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <FileText size={11} />
              Note (optional)
            </Label>
            <Textarea
              placeholder="What's this for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-2xl text-sm resize-none min-h-[72px]"
              rows={2}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!canSubmit}
            className="w-full h-12 rounded-2xl text-sm font-bold mt-1"
          >
            {sendFunds.isPending ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={16} className="mr-2" />
                Send ₹{isAmountValid ? formatINR(parsedAmount) : '0.00'}
              </>
            )}
          </Button>

          <p className="text-[10px] text-muted-foreground text-center">
            Funds will be deducted from your wallet immediately
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
