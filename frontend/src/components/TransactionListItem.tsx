import type { WalletTransaction } from '../backend';
import { ArrowDownCircle, ArrowUpCircle, Lock, Wallet } from 'lucide-react';

interface TransactionListItemProps {
  tx: WalletTransaction;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTransactionMeta(tx: WalletTransaction): {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  sublabel: string;
  amountColor: string;
  prefix: string;
  badge: string;
  badgeColor: string;
} {
  const type = tx.transactionType;

  if (type === 'received' || type === 'legacy') {
    return {
      icon: <ArrowDownCircle size={16} className="text-success" />,
      iconBg: 'bg-success/10',
      label: tx.recipientLabel ? `From ${tx.recipientLabel}` : 'Money Received',
      sublabel: tx.note || 'Received',
      amountColor: 'text-success',
      prefix: '+',
      badge: 'Received',
      badgeColor: 'bg-success/10 text-success',
    };
  }

  if (type === 'sent') {
    return {
      icon: <ArrowUpCircle size={16} className="text-destructive" />,
      iconBg: 'bg-destructive/10',
      label: tx.recipientLabel ? `To ${tx.recipientLabel}` : 'Money Sent',
      sublabel: tx.note || 'Sent',
      amountColor: 'text-destructive',
      prefix: '-',
      badge: 'Sent',
      badgeColor: 'bg-destructive/10 text-destructive',
    };
  }

  if (type === 'locker_transfer' || type === 'transfer') {
    return {
      icon: <Lock size={16} className="text-invest" />,
      iconBg: 'bg-invest/10',
      label: 'To Digital Locker',
      sublabel: tx.note || 'Locker transfer',
      amountColor: 'text-invest',
      prefix: '-',
      badge: 'Locked',
      badgeColor: 'bg-invest/10 text-invest',
    };
  }

  // Fallback
  return {
    icon: <Wallet size={16} className="text-muted-foreground" />,
    iconBg: 'bg-muted',
    label: 'Transaction',
    sublabel: tx.note || 'Wallet activity',
    amountColor: 'text-foreground',
    prefix: '',
    badge: type,
    badgeColor: 'bg-muted text-muted-foreground',
  };
}

export default function TransactionListItem({ tx }: TransactionListItemProps) {
  const meta = getTransactionMeta(tx);

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${meta.iconBg}`}
      >
        {meta.icon}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{meta.label}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {meta.sublabel} · {formatTime(tx.timestamp)}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${meta.amountColor}`}>
          {meta.prefix}₹{formatINR(tx.amount)}
        </p>
        <span
          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${meta.badgeColor}`}
        >
          {meta.badge}
        </span>
      </div>
    </div>
  );
}
