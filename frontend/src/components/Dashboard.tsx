import { useRouter } from '@tanstack/react-router';
import { useGetProfile, useGetLockerStatus, useGetWalletBalance } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import BalanceCard from './BalanceCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet, PiggyBank, TrendingUp, Plus, Target, ChevronRight,
  Settings, LogOut, ShoppingBag, Bus, BookOpen, Gamepad2, Heart, MoreHorizontal,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function formatINR(amount: number | bigint): string {
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num);
}

const categoryIcons: Record<string, React.ReactNode> = {
  Food: <ShoppingBag size={14} />,
  Transport: <Bus size={14} />,
  Education: <BookOpen size={14} />,
  Entertainment: <Gamepad2 size={14} />,
  Health: <Heart size={14} />,
  Other: <MoreHorizontal size={14} />,
};

const categoryColors: Record<string, string> = {
  Food: 'bg-orange-100 text-orange-600',
  Transport: 'bg-blue-100 text-blue-600',
  Education: 'bg-purple-100 text-purple-600',
  Entertainment: 'bg-pink-100 text-pink-600',
  Health: 'bg-red-100 text-red-600',
  Other: 'bg-gray-100 text-gray-600',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export default function Dashboard() {
  const router = useRouter();
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useGetProfile();
  const { data: lockerStatus } = useGetLockerStatus();
  const { data: walletBalance } = useGetWalletBalance();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  if (isLoading) {
    return (
      <div className="page-content space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  // No income set up yet
  if (!profile || profile.incomeSources.length === 0) {
    return (
      <div className="page-content flex flex-col items-center justify-center min-h-[70vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl gradient-primary flex items-center justify-center">
          <Wallet size={28} className="text-white" />
        </div>
        <h2 className="text-xl font-bold">Set Up Your Budget</h2>
        <p className="text-muted-foreground text-sm">Add your income sources to get started</p>
        <Button onClick={() => router.navigate({ to: '/onboarding' })} className="rounded-xl h-12 px-8">
          Set Up Budget
        </Button>
      </div>
    );
  }

  const totalIncome = profile.incomeSources.reduce((sum, s) => sum + s.amount, 0);
  const { spendingPct, savingPct, investingPct } = profile.allocation;
  const spendingAmt = (totalIncome * spendingPct) / 100;
  const savingAmt = (totalIncome * savingPct) / 100;
  const investingAmt = (totalIncome * investingPct) / 100;

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const today = new Date().getDate();
  const daysRemaining = daysInMonth - today + 1;
  const dailySpend = spendingAmt / daysInMonth;

  const totalExpenses = profile.expenses.reduce((sum, e) => sum + e.amount, 0);
  const recentExpenses = [...profile.expenses].reverse().slice(0, 5);

  const isLocked = lockerStatus?.locked ?? profile.digitalLocker.locked;
  const walletAmt = walletBalance !== undefined ? Number(walletBalance) : null;

  return (
    <div className="page-content space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-xs text-muted-foreground">Good {getGreeting()},</p>
          <h1 className="text-xl font-bold text-foreground">{profile.userProfile.displayName} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.navigate({ to: '/onboarding' })}
            className="w-9 h-9 rounded-xl"
          >
            <Settings size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl text-muted-foreground"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>

      {/* Total Income Banner */}
      <div className="gradient-primary rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-10 translate-x-10" />
        <p className="text-xs text-white/75 uppercase tracking-wide font-semibold">Monthly Income</p>
        <p className="text-4xl font-bold mt-1">₹{formatINR(totalIncome)}</p>
        <p className="text-xs text-white/75 mt-1">
          {profile.incomeSources.map(s => s.name).join(' + ')}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="bg-white/20 rounded-full px-3 py-1">
            <span className="text-xs font-semibold">Daily limit: ₹{formatINR(dailySpend)}</span>
          </div>
          <div className="bg-white/20 rounded-full px-3 py-1">
            <span className="text-xs font-semibold">{daysRemaining}d left</span>
          </div>
        </div>
      </div>

      {/* Balance Cards - 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <BalanceCard
          title="Spend"
          amount={spendingAmt}
          subtitle={`${spendingPct}% of income`}
          gradientClass="gradient-spending"
          icon={<Wallet size={14} />}
        />
        <BalanceCard
          title="Save"
          amount={savingAmt}
          subtitle={`${savingPct}% of income`}
          gradientClass="gradient-saving"
          icon={<PiggyBank size={14} />}
          locked={isLocked}
        />
        <BalanceCard
          title="Invest"
          amount={investingAmt}
          subtitle={`${investingPct}% of income`}
          gradientClass="gradient-invest"
          icon={<TrendingUp size={14} />}
        />
        <BalanceCard
          title="Wallet"
          amount={walletAmt ?? 0}
          subtitle={walletAmt !== null ? 'In-app wallet' : 'Not set up'}
          gradientClass="gradient-wallet"
          icon={<Wallet size={14} />}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.navigate({ to: '/expenses' })}
            className="bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
              <Plus size={16} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">Add Expense</p>
              <p className="text-[10px] text-muted-foreground">Track spending</p>
            </div>
          </button>
          <button
            onClick={() => router.navigate({ to: '/goals' })}
            className="bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
              <Target size={16} className="text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">Set Goal</p>
              <p className="text-[10px] text-muted-foreground">Save smarter</p>
            </div>
          </button>
          <button
            onClick={() => router.navigate({ to: '/invest' })}
            className="bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">Invest</p>
              <p className="text-[10px] text-muted-foreground">Grow money</p>
            </div>
          </button>
          <button
            onClick={() => router.navigate({ to: '/wallet' })}
            className="bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <Wallet size={16} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">My Wallet</p>
              <p className="text-[10px] text-muted-foreground">Pay & transfer</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Expenses */}
      {recentExpenses.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <h2 className="text-sm font-semibold">Recent Expenses</h2>
            <button
              onClick={() => router.navigate({ to: '/expenses' })}
              className="flex items-center gap-1 text-xs text-primary font-medium"
            >
              See all <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-border">
            {recentExpenses.map((expense, idx) => {
              const icon = categoryIcons[expense.category] ?? categoryIcons['Other'];
              const colorClass = categoryColors[expense.category] ?? categoryColors['Other'];
              const dateMs = Number(expense.date) / 1_000_000;
              return (
                <div key={idx} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClass}`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{expense.category}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {expense.note || formatDistanceToNow(new Date(dateMs), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-destructive">-₹{formatINR(expense.amount)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spending Summary */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-card">
        <h2 className="text-sm font-semibold mb-3">This Month</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Spent</span>
            <span className="font-semibold text-destructive">₹{formatINR(totalExpenses)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Remaining Budget</span>
            <span className="font-semibold text-success">₹{formatINR(Math.max(0, spendingAmt - totalExpenses))}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all ${
                totalExpenses / spendingAmt > 0.9
                  ? 'bg-destructive'
                  : totalExpenses / spendingAmt > 0.7
                  ? 'bg-warning'
                  : 'bg-success'
              }`}
              style={{ width: `${Math.min(100, (totalExpenses / spendingAmt) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-right">
            {Math.round((totalExpenses / spendingAmt) * 100)}% of spending budget used
          </p>
        </div>
      </div>

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
