import React, { useState } from 'react';
import {
  Plus, ArrowUpRight, ArrowDownLeft, Vault, ShieldCheck,
  ArrowRight, TrendingDown, TrendingUp, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  useGetWalletProfile,
  useGetWalletBalance,
  useGetWalletTransactions,
  useCreateWallet,
  useAddFundsToWallet,
  useDeductFromWallet,
  useTransferToLockerFromWallet,
} from '../hooks/useQueries';
import { TransactionType } from '../backend';
import type { Transaction } from '../backend';
import WalletPINSetup from './WalletPINSetup';
import WalletPINVerify from './WalletPINVerify';
import KYCFlow from './KYCFlow';
import ComplianceNotice from './ComplianceNotice';

function formatINR(amount: bigint | number): string {
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num);
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function groupTransactionsByDate(transactions: Transaction[]): { label: string; txns: Transaction[] }[] {
  const sorted = [...transactions].sort((a, b) => Number(b.timestamp - a.timestamp));
  const groups = new Map<string, Transaction[]>();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const txn of sorted) {
    const ms = Number(txn.timestamp) / 1_000_000;
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);

    let label: string;
    if (d.getTime() === today.getTime()) label = 'Today';
    else if (d.getTime() === yesterday.getTime()) label = 'Yesterday';
    else label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(txn);
  }

  return Array.from(groups.entries()).map(([label, txns]) => ({ label, txns }));
}

function TransactionItem({ txn }: { txn: Transaction }) {
  const isCredit = txn.transactionType === TransactionType.credit;
  const isLocker = txn.transactionType === TransactionType.lockerTransfer;

  const iconBg = isCredit
    ? 'bg-success/10'
    : isLocker
    ? 'bg-invest/10'
    : 'bg-destructive/10';

  const iconColor = isCredit ? 'text-success' : isLocker ? 'text-invest' : 'text-destructive';
  const amountColor = isCredit ? 'text-success' : isLocker ? 'text-invest' : 'text-destructive';
  const amountPrefix = isCredit ? '+' : '-';

  const Icon = isCredit ? ArrowDownLeft : isLocker ? Vault : ArrowUpRight;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={16} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{txn.transactionLabel || 'Transaction'}</p>
        <p className="text-[10px] text-muted-foreground">{formatTimestamp(txn.timestamp)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${amountColor}`}>
          {amountPrefix}₹{formatINR(txn.amount)}
        </p>
        <Badge
          variant="outline"
          className={`text-[9px] px-1.5 py-0 h-4 ${
            isCredit
              ? 'border-success/30 text-success'
              : isLocker
              ? 'border-invest/30 text-invest'
              : 'border-destructive/30 text-destructive'
          }`}
        >
          {isCredit ? 'Credit' : isLocker ? 'Locker' : 'Debit'}
        </Badge>
      </div>
    </div>
  );
}

type ActiveSection = 'add' | 'pay' | 'locker' | 'kyc' | null;

function WalletContent() {
  const { data: walletProfile, isLoading: profileLoading } = useGetWalletProfile();
  const { data: balance, isLoading: balanceLoading } = useGetWalletBalance();
  const { data: transactions, isLoading: txLoading } = useGetWalletTransactions();
  const createWallet = useCreateWallet();
  const addFunds = useAddFundsToWallet();
  const deductFunds = useDeductFromWallet();
  const transferToLocker = useTransferToLockerFromWallet();

  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  // Add funds form
  const [addAmount, setAddAmount] = useState('');
  const [addLabel, setAddLabel] = useState('');

  // Pay/Send form
  const [payAmount, setPayAmount] = useState('');
  const [payLabel, setPayLabel] = useState('');

  // Locker transfer form
  const [lockerAmount, setLockerAmount] = useState('');

  const toggleSection = (section: ActiveSection) => {
    setActiveSection(prev => (prev === section ? null : section));
  };

  const handleCreateWallet = async () => {
    try {
      await createWallet.mutateAsync();
      toast.success('Wallet created successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('already exists')) {
        toast.info('Wallet already exists.');
      } else {
        toast.error('Failed to create wallet.');
      }
    }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(addAmount, 10);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount.');
      return;
    }
    try {
      await addFunds.mutateAsync({ amount: BigInt(amt), transactionLabel: addLabel || 'Top Up' });
      toast.success(`₹${formatINR(amt)} added to wallet!`);
      setAddAmount('');
      setAddLabel('');
      setActiveSection(null);
    } catch {
      toast.error('Failed to add funds.');
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(payAmount, 10);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount.');
      return;
    }
    const currentBalance = balance ?? BigInt(0);
    if (BigInt(amt) > currentBalance) {
      toast.error('Insufficient wallet balance.');
      return;
    }
    try {
      await deductFunds.mutateAsync({ amount: BigInt(amt), transactionLabel: payLabel || 'Payment' });
      toast.success(`₹${formatINR(amt)} paid successfully!`);
      setPayAmount('');
      setPayLabel('');
      setActiveSection(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Insufficient')) {
        toast.error('Insufficient balance.');
      } else {
        toast.error('Payment failed.');
      }
    }
  };

  const handleLockerTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(lockerAmount, 10);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount.');
      return;
    }
    const currentBalance = balance ?? BigInt(0);
    if (BigInt(amt) > currentBalance) {
      toast.error('Insufficient wallet balance.');
      return;
    }
    try {
      await transferToLocker.mutateAsync({ amount: BigInt(amt) });
      toast.success(`₹${formatINR(amt)} transferred to Digital Locker!`);
      setLockerAmount('');
      setActiveSection(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Insufficient')) {
        toast.error('Insufficient balance.');
      } else {
        toast.error('Transfer failed.');
      }
    }
  };

  if (profileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  // Wallet doesn't exist yet
  if (!walletProfile || (walletProfile.balance === BigInt(0) && !walletProfile.hasPin && walletProfile.kycStatus === 'none')) {
    // Check if wallet truly doesn't exist by trying to see if getWalletProfile returned a default
    // We show create wallet option
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 px-4">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
          <Plus size={28} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold">Create Your Wallet</h2>
        <p className="text-sm text-muted-foreground">
          Set up your in-app digital wallet to start making payments and tracking transactions.
        </p>
        <Button
          onClick={handleCreateWallet}
          className="h-12 px-8 rounded-xl"
          disabled={createWallet.isPending}
        >
          {createWallet.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Creating...
            </span>
          ) : (
            'Create Wallet'
          )}
        </Button>
        <ComplianceNotice />
      </div>
    );
  }

  const currentBalance = balance ?? BigInt(0);
  const grouped = groupTransactionsByDate(transactions ?? []);

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, oklch(0.45 0.18 260), oklch(0.55 0.16 280))' }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/10 translate-y-8 -translate-x-8" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-white/75 uppercase tracking-wide font-semibold">Wallet Balance</p>
            {balanceLoading && (
              <RefreshCw size={12} className="text-white/60 animate-spin" />
            )}
          </div>
          <p className="text-4xl font-bold tracking-tight">₹{formatINR(currentBalance)}</p>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <div className="bg-white/20 rounded-full px-3 py-1">
              <span className="text-xs font-semibold">
                KYC: {walletProfile.kycStatus === 'full' ? 'Full ✓' : walletProfile.kycStatus === 'basic' ? 'Basic ✓' : 'None'}
              </span>
            </div>
            <div className="bg-white/20 rounded-full px-3 py-1">
              <span className="text-xs font-semibold">
                PIN: {walletProfile.hasPin ? 'Set ✓' : 'Not Set'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { id: 'add' as ActiveSection, icon: Plus, label: 'Add Money', color: 'bg-success/10 text-success' },
          { id: 'pay' as ActiveSection, icon: ArrowUpRight, label: 'Pay/Send', color: 'bg-destructive/10 text-destructive' },
          { id: 'locker' as ActiveSection, icon: Vault, label: 'To Locker', color: 'bg-invest/10 text-invest' },
          { id: 'kyc' as ActiveSection, icon: ShieldCheck, label: 'KYC', color: 'bg-primary/10 text-primary' },
        ].map(({ id, icon: Icon, label, color }) => (
          <button
            key={id}
            onClick={() => toggleSection(id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
              activeSection === id
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:bg-muted/30'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={16} />
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Add Money Section */}
      {activeSection === 'add' && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Plus size={14} className="text-success" /> Add Money
            </p>
            <button onClick={() => setActiveSection(null)}>
              <ChevronUp size={16} className="text-muted-foreground" />
            </button>
          </div>
          <form onSubmit={handleAddFunds} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="add-amount" className="text-xs">Amount (₹)</Label>
              <Input
                id="add-amount"
                type="number"
                min="1"
                placeholder="Enter amount"
                value={addAmount}
                onChange={e => setAddAmount(e.target.value)}
                className="h-10 rounded-xl text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-label" className="text-xs">Source / Label</Label>
              <Input
                id="add-label"
                placeholder="e.g. Cash, UPI, Card"
                value={addLabel}
                onChange={e => setAddLabel(e.target.value)}
                className="h-10 rounded-xl text-sm"
              />
            </div>
            <Button type="submit" className="w-full h-10 rounded-xl" disabled={addFunds.isPending}>
              {addFunds.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Adding...
                </span>
              ) : (
                'Add to Wallet'
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Pay/Send Section */}
      {activeSection === 'pay' && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold flex items-center gap-2">
              <ArrowUpRight size={14} className="text-destructive" /> Pay / Send
            </p>
            <button onClick={() => setActiveSection(null)}>
              <ChevronUp size={16} className="text-muted-foreground" />
            </button>
          </div>
          <div className="bg-muted/40 rounded-xl px-3 py-2 text-xs text-muted-foreground">
            Available: <span className="font-semibold text-foreground">₹{formatINR(currentBalance)}</span>
          </div>
          <form onSubmit={handlePay} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pay-amount" className="text-xs">Amount (₹)</Label>
              <Input
                id="pay-amount"
                type="number"
                min="1"
                placeholder="Enter amount"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className="h-10 rounded-xl text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-label" className="text-xs">Recipient / Purpose</Label>
              <Input
                id="pay-label"
                placeholder="e.g. Canteen, Books, Friend"
                value={payLabel}
                onChange={e => setPayLabel(e.target.value)}
                className="h-10 rounded-xl text-sm"
              />
            </div>
            <Button
              type="submit"
              variant="destructive"
              className="w-full h-10 rounded-xl"
              disabled={deductFunds.isPending}
            >
              {deductFunds.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                'Pay Now'
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Transfer to Locker Section */}
      {activeSection === 'locker' && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Vault size={14} className="text-invest" /> Transfer to Locker
            </p>
            <button onClick={() => setActiveSection(null)}>
              <ChevronUp size={16} className="text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Move funds from your wallet to the Digital Locker for safe, locked savings.
          </p>
          <div className="bg-muted/40 rounded-xl px-3 py-2 text-xs text-muted-foreground">
            Available: <span className="font-semibold text-foreground">₹{formatINR(currentBalance)}</span>
          </div>
          <form onSubmit={handleLockerTransfer} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="locker-amount" className="text-xs">Amount (₹)</Label>
              <Input
                id="locker-amount"
                type="number"
                min="1"
                placeholder="Enter amount"
                value={lockerAmount}
                onChange={e => setLockerAmount(e.target.value)}
                className="h-10 rounded-xl text-sm"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-10 rounded-xl bg-invest hover:bg-invest/90 text-invest-foreground"
              disabled={transferToLocker.isPending}
            >
              {transferToLocker.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Transferring...
                </span>
              ) : (
                'Transfer to Locker'
              )}
            </Button>
          </form>
        </div>
      )}

      {/* KYC Section */}
      {activeSection === 'kyc' && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck size={14} className="text-primary" /> KYC Verification
            </p>
            <button onClick={() => setActiveSection(null)}>
              <ChevronUp size={16} className="text-muted-foreground" />
            </button>
          </div>
          <KYCFlow />
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <h2 className="text-sm font-semibold">Transaction History</h2>
        </div>

        {txLoading ? (
          <div className="px-4 pb-4 space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-3/4 rounded" />
                  <Skeleton className="h-2 w-1/2 rounded" />
                </div>
                <Skeleton className="h-4 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="px-4 pb-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={20} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add money to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {grouped.map(({ label, txns }) => (
              <div key={label}>
                <div className="px-4 py-2 bg-muted/30">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                </div>
                <div className="px-4 divide-y divide-border/50">
                  {txns.map(txn => (
                    <TransactionItem key={Number(txn.id)} txn={txn} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compliance Notice */}
      <ComplianceNotice />

      {/* Footer */}
      <div className="pb-6 text-center">
        <p className="text-[10px] text-muted-foreground">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium"
          >
            caffeine.ai
          </a>{' '}
          · © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export default function Wallet() {
  const { data: walletProfile, isLoading: profileLoading } = useGetWalletProfile();
  const [pinVerified, setPinVerified] = useState(false);

  if (profileLoading) {
    return (
      <div className="page-content space-y-4">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Wallet exists and has a PIN but not yet verified this session
  const walletExists = walletProfile && (walletProfile.hasPin || Number(walletProfile.balance) > 0 || walletProfile.kycStatus !== 'none');

  return (
    <div className="page-content space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-xs text-muted-foreground">My</p>
          <h1 className="text-xl font-bold text-foreground">Digital Wallet</h1>
        </div>
      </div>

      {/* PIN Setup: wallet exists but no PIN set */}
      {walletExists && !walletProfile.hasPin && (
        <WalletPINSetup onComplete={() => {}} />
      )}

      {/* PIN Verify: wallet has PIN but not verified this session */}
      {walletExists && walletProfile.hasPin && !pinVerified && (
        <WalletPINVerify onVerified={() => setPinVerified(true)} />
      )}

      {/* Main wallet content: no PIN required OR PIN verified */}
      {(!walletExists || !walletProfile?.hasPin || pinVerified) && (
        <WalletContent />
      )}
    </div>
  );
}
