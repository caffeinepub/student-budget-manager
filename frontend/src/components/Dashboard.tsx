import { useRouter } from '@tanstack/react-router';
import { useGetProfile, useGetLockerStatus } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import BalanceCard from './BalanceCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet, PiggyBank, TrendingUp, Plus, Target, ChevronRight,
  Settings, LogOut, ShoppingBag, Bus, BookOpen, Gamepad2, Heart, MoreHorizontal
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
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

export default function Dashboard() {
  const router = useRouter();
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useGetProfile();
  const { data: lockerStatus } = useGetLockerStatus();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  if (isLoading) {
    return (
      <div className="page-content space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
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

      {/* Balance Cards */}
      <div className="grid grid-cols-3 gap-3">
        <BalanceCard
          title="Spend"
          amount={spendingAmt - totalExpenses > 0 ? spendingAmt - totalExpenses : 0}
          subtitle={`${spendingPct}% of income`}
          gradientClass="gradient-spending"
          icon={<Wallet size={14} className="text-white" />}
        />
        <BalanceCard
          title="Save"
          amount={savingAmt}
          subtitle={`${savingPct}% of income`}
          gradientClass="gradient-saving"
          icon={<PiggyBank size={14} className="text-white" />}
          locked={isLocked}
        />
        <BalanceCard
          title="Invest"
          amount={investingAmt}
          subtitle={`${investingPct}% of income`}
          gradientClass="gradient-invest"
          icon={<TrendingUp size={14} className="text-white" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Add Expense', icon: Plus, path: '/expenses', color: 'bg-primary/10 text-primary' },
          { label: 'View Goals', icon: Target, path: '/goals', color: 'bg-success/10 text-success' },
          { label: 'Investments', icon: TrendingUp, path: '/invest', color: 'bg-invest/10 text-invest' },
        ].map(({ label, icon: Icon, path, color }) => (
          <button
            key={path}
            onClick={() => router.navigate({ to: path })}
            className="card-base flex flex-col items-center gap-2 py-4 touch-target hover:shadow-card-hover transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
              <Icon size={18} />
            </div>
            <span className="text-xs font-semibold text-foreground text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Recent Expenses */}
      <div className="card-base space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Recent Expenses</h3>
          <button
            onClick={() => router.navigate({ to: '/expenses' })}
            className="flex items-center gap-1 text-xs text-primary font-semibold"
          >
            See all <ChevronRight size={14} />
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">No expenses yet</p>
            <p className="text-xs text-muted-foreground mt-1">Tap "Add Expense" to track spending</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentExpenses.map((expense, i) => {
              const dateMs = Number(expense.date) / 1_000_000;
              const dateObj = new Date(dateMs);
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${categoryColors[expense.category] || categoryColors.Other}`}>
                    {categoryIcons[expense.category] || categoryIcons.Other}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{expense.category}</p>
                    <p className="text-xs text-muted-foreground truncate">{expense.note || formatDistanceToNow(dateObj, { addSuffix: true })}</p>
                  </div>
                  <span className="text-sm font-bold text-destructive flex-shrink-0">-₹{formatINR(expense.amount)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-muted-foreground">
        <p>
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:underline"
          >
            caffeine.ai
          </a>
        </p>
        <p className="mt-0.5">© {new Date().getFullYear()} Student Budget Manager</p>
      </footer>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
