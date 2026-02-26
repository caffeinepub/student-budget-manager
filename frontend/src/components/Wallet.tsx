import { useState } from 'react';
import { toast } from 'sonner';
import {
  useGetWalletBalance,
  useGetWalletTransactions,
  useAddFundsToWallet,
  useTransferToLocker,
} from '../hooks/useQueries';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Wallet as WalletIcon,
  ArrowDownCircle,
  Lock,
  Loader2,
  RefreshCw,
  QrCode,
  ScanLine,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { WalletTransaction } from '../backend';
import QRScannerModal from './QRScannerModal';
import ReceiveMoneyModal from './ReceiveMoneyModal';
import SendMoneyForm from './SendMoneyForm';
import TransactionListItem from './TransactionListItem';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface GroupedTransactions {
  label: string;
  items: WalletTransaction[];
}

function groupTransactionsByDate(transactions: WalletTransaction[]): GroupedTransactions[] {
  const groups: Record<string, WalletTransaction[]> = {};
  for (const tx of transactions) {
    const label = formatDate(tx.timestamp);
    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
  }
  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

export default function Wallet() {
  const { data: balance = 0, isLoading: balanceLoading } = useGetWalletBalance();
  const { data: transactions = [], isLoading: txLoading } = useGetWalletTransactions();
  const { data: userProfile } = useGetCallerUserProfile();
  const { identity } = useInternetIdentity();

  // Modal states
  const [showScanner, setShowScanner] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);
  const [scannedRecipient, setScannedRecipient] = useState('');

  // Add funds form state (collapsible)
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [receiveAmount, setReceiveAmount] = useState('');
  const [senderLabel, setSenderLabel] = useState('');
  const [receiveNote, setReceiveNote] = useState('');

  // Transfer to Locker form state (collapsible)
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  const addFunds = useAddFundsToWallet();
  const transferToLocker = useTransferToLocker();

  // Payment ID: use display name + principal short form
  const principalStr = identity?.getPrincipal().toString() ?? '';
  const shortPrincipal = principalStr.length > 12
    ? `${principalStr.slice(0, 6)}...${principalStr.slice(-4)}`
    : principalStr;
  const displayName = userProfile?.displayName ?? 'User';
  const paymentId = principalStr || displayName;

  const handleQRScan = (data: string) => {
    setShowScanner(false);
    setScannedRecipient(data);
    setShowSendForm(true);
  };

  const handleReceive = async () => {
    const amount = parseFloat(receiveAmount);
    if (!receiveAmount || isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      await addFunds.mutateAsync({
        amount,
        senderLabel: senderLabel.trim() || null,
        note: receiveNote.trim(),
      });
      toast.success(`₹${formatINR(amount)} added to your wallet!`);
      setReceiveAmount('');
      setSenderLabel('');
      setReceiveNote('');
      setShowAddFunds(false);
    } catch {
      toast.error('Failed to add funds. Please try again.');
    }
  };

  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (!transferAmount || isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount > balance) {
      toast.error('Insufficient wallet balance');
      return;
    }
    try {
      await transferToLocker.mutateAsync({
        amount,
        note: transferNote.trim(),
      });
      toast.success(`₹${formatINR(amount)} transferred to Digital Locker!`);
      setTransferAmount('');
      setTransferNote('');
      setShowTransfer(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Insufficient')) {
        toast.error('Insufficient wallet balance');
      } else {
        toast.error('Transfer failed. Please try again.');
      }
    }
  };

  const grouped = groupTransactionsByDate(transactions);

  return (
    <>
      <div className="page-content space-y-4 animate-slide-up pb-8">
        {/* Header */}
        <div className="pt-2">
          <h1 className="text-xl font-bold text-foreground">My Wallet</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Peer-to-peer payments, no bank needed</p>
        </div>

        {/* Balance Card */}
        <div className="gradient-primary rounded-3xl p-5 text-white relative overflow-hidden shadow-card-hover">
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-white/10 -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 translate-y-10 -translate-x-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <WalletIcon size={15} />
              </div>
              <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                Wallet Balance
              </span>
            </div>
            {balanceLoading ? (
              <Skeleton className="h-12 w-44 bg-white/20 rounded-xl mb-2" />
            ) : (
              <p className="text-5xl font-extrabold tracking-tight mb-1">
                ₹{formatINR(balance)}
              </p>
            )}
            <p className="text-xs text-white/60 mb-4">Available to spend or transfer</p>

            {/* User ID chip */}
            <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
              <span className="text-[10px] font-semibold text-white/90 font-mono">
                {displayName} · {shortPrincipal}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-3 gap-3">
          {/* Receive */}
          <button
            onClick={() => setShowReceive(true)}
            className="flex flex-col items-center gap-2 bg-card rounded-2xl p-4 border border-border shadow-card hover:shadow-card-hover transition-all active:scale-95"
          >
            <div className="w-11 h-11 rounded-2xl bg-success/10 flex items-center justify-center">
              <QrCode size={20} className="text-success" />
            </div>
            <span className="text-[11px] font-semibold text-foreground">Receive</span>
          </button>

          {/* Scan & Pay */}
          <button
            onClick={() => setShowScanner(true)}
            className="flex flex-col items-center gap-2 bg-card rounded-2xl p-4 border border-border shadow-card hover:shadow-card-hover transition-all active:scale-95"
          >
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ScanLine size={20} className="text-primary" />
            </div>
            <span className="text-[11px] font-semibold text-foreground">Scan & Pay</span>
          </button>

          {/* Transfer to Locker */}
          <button
            onClick={() => setShowTransfer(!showTransfer)}
            className="flex flex-col items-center gap-2 bg-card rounded-2xl p-4 border border-border shadow-card hover:shadow-card-hover transition-all active:scale-95"
          >
            <div className="w-11 h-11 rounded-2xl bg-invest/10 flex items-center justify-center">
              <Lock size={20} className="text-invest" />
            </div>
            <span className="text-[11px] font-semibold text-foreground">To Locker</span>
          </button>
        </div>

        {/* Transfer to Locker - Collapsible Form */}
        {showTransfer && (
          <div className="bg-card rounded-2xl p-4 border border-border shadow-card space-y-3 animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-invest/10 flex items-center justify-center">
                  <Lock size={14} className="text-invest" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Transfer to Digital Locker</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Available: ₹{formatINR(balance)}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowTransfer(false)} className="text-muted-foreground hover:text-foreground">
                <ChevronUp size={16} />
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Amount (₹) *</Label>
                <Input
                  type="number"
                  placeholder="Enter amount to lock"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="h-10 rounded-xl text-sm"
                  min="1"
                  max={balance}
                />
                {transferAmount && parseFloat(transferAmount) > balance && (
                  <p className="text-xs text-destructive mt-1">Amount exceeds wallet balance</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Note (optional)</Label>
                <Input
                  type="text"
                  placeholder="e.g. Emergency fund, Savings"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="h-10 rounded-xl text-sm"
                />
              </div>
            </div>
            <Button
              onClick={handleTransfer}
              disabled={
                transferToLocker.isPending ||
                !transferAmount ||
                parseFloat(transferAmount) > balance ||
                parseFloat(transferAmount) <= 0
              }
              variant="outline"
              className="w-full h-10 rounded-xl text-sm font-semibold border-invest text-invest hover:bg-invest hover:text-white"
            >
              {transferToLocker.isPending ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Transferring...
                </>
              ) : (
                <>
                  <Lock size={14} className="mr-2" />
                  Transfer to Locker
                </>
              )}
            </Button>
          </div>
        )}

        {/* Add Funds Section */}
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <button
            onClick={() => setShowAddFunds(!showAddFunds)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center">
                <Plus size={15} className="text-success" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Add Funds</p>
                <p className="text-[10px] text-muted-foreground">Simulate receiving money</p>
              </div>
            </div>
            {showAddFunds ? (
              <ChevronUp size={16} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={16} className="text-muted-foreground" />
            )}
          </button>

          {showAddFunds && (
            <>
              <Separator />
              <div className="p-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Amount (₹) *</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={receiveAmount}
                    onChange={(e) => setReceiveAmount(e.target.value)}
                    className="h-10 rounded-xl text-sm"
                    min="1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Sender Label (optional)</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Mom, Freelance, Scholarship"
                    value={senderLabel}
                    onChange={(e) => setSenderLabel(e.target.value)}
                    className="h-10 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Note (optional)</Label>
                  <Input
                    type="text"
                    placeholder="Add a note"
                    value={receiveNote}
                    onChange={(e) => setReceiveNote(e.target.value)}
                    className="h-10 rounded-xl text-sm"
                  />
                </div>
                <Button
                  onClick={handleReceive}
                  disabled={addFunds.isPending}
                  className="w-full h-10 rounded-xl text-sm font-semibold"
                >
                  {addFunds.isPending ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Adding Funds...
                    </>
                  ) : (
                    <>
                      <ArrowDownCircle size={14} className="mr-2" />
                      Add to Wallet
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                <RefreshCw size={14} className="text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">Transaction History</h2>
                {transactions.length > 0 && (
                  <p className="text-[10px] text-muted-foreground">{transactions.length} transactions</p>
                )}
              </div>
            </div>
            {txLoading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          </div>
          <Separator />

          {txLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <WalletIcon size={22} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add funds or scan a QR code to get started
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {grouped.map(({ label, items }) => (
                <div key={label}>
                  <div className="px-4 py-2 bg-muted/40">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {label}
                    </span>
                  </div>
                  {items.map((tx) => (
                    <TransactionListItem key={Number(tx.id)} tx={tx} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-2">
          <p className="text-[10px] text-muted-foreground">
            Built with{' '}
            <span className="text-destructive">♥</span>{' '}
            using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'unknown-app')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScannerModal
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Receive Money Modal */}
      <ReceiveMoneyModal
        open={showReceive}
        onClose={() => setShowReceive(false)}
        paymentId={paymentId}
        displayName={displayName}
      />

      {/* Send Money Form */}
      <SendMoneyForm
        open={showSendForm}
        onClose={() => {
          setShowSendForm(false);
          setScannedRecipient('');
        }}
        prefillRecipient={scannedRecipient}
        walletBalance={balance}
      />
    </>
  );
}
