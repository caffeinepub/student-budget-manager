import { useState } from 'react';
import { useGetExpenses, useAddExpense, useGetProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, ShoppingBag, Bus, BookOpen, Gamepad2, Heart, MoreHorizontal, X } from 'lucide-react';
import { groupExpensesByDate } from '../utils/dateGrouping';
import type { Expense } from '../backend';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
}

const CATEGORIES = ['Food', 'Transport', 'Education', 'Entertainment', 'Health', 'Other'];

const categoryIcons: Record<string, React.ReactNode> = {
  Food: <ShoppingBag size={16} />,
  Transport: <Bus size={16} />,
  Education: <BookOpen size={16} />,
  Entertainment: <Gamepad2 size={16} />,
  Health: <Heart size={16} />,
  Other: <MoreHorizontal size={16} />,
};

const categoryColors: Record<string, string> = {
  Food: 'bg-orange-100 text-orange-600',
  Transport: 'bg-blue-100 text-blue-600',
  Education: 'bg-purple-100 text-purple-600',
  Entertainment: 'bg-pink-100 text-pink-600',
  Health: 'bg-red-100 text-red-600',
  Other: 'bg-gray-100 text-gray-600',
};

export default function ExpenseTracker() {
  const { identity } = useInternetIdentity();
  const { data: expenses, isLoading: expensesLoading } = useGetExpenses();
  const { data: profile } = useGetProfile();
  const { mutateAsync: addExpense, isPending } = useAddExpense();

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');

  const totalIncome = profile?.incomeSources.reduce((sum, s) => sum + s.amount, 0) ?? 0;
  const spendingBudget = (totalIncome * (profile?.allocation.spendingPct ?? 50)) / 100;
  const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const usedPct = spendingBudget > 0 ? (totalExpenses / spendingBudget) * 100 : 0;

  const progressColor =
    usedPct >= 95 ? 'bg-destructive' : usedPct >= 75 ? 'bg-warning' : 'bg-primary';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      await addExpense({ amount: amt, category, note });
      toast.success(`₹${formatINR(amt)} added to ${category}`);
      setAmount('');
      setNote('');
      setShowForm(false);
    } catch {
      toast.error('Failed to add expense');
    }
  };

  const grouped = groupExpensesByDate(expenses ?? []);

  return (
    <div className="page-content space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">Expenses</h1>
          <p className="text-xs text-muted-foreground">Track your daily spending</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="rounded-xl h-9 gap-1.5"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add'}
        </Button>
      </div>

      {/* Spending Progress */}
      <div className="card-base space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Monthly Budget Used</span>
          <span className={`text-sm font-bold ${usedPct >= 95 ? 'text-destructive' : usedPct >= 75 ? 'text-warning' : 'text-primary'}`}>
            {Math.min(usedPct, 100).toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${Math.min(usedPct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Spent: ₹{formatINR(totalExpenses)}</span>
          <span>Budget: ₹{formatINR(spendingBudget)}</span>
        </div>
        {usedPct >= 75 && (
          <p className={`text-xs font-medium ${usedPct >= 95 ? 'text-destructive' : 'text-warning'}`}>
            {usedPct >= 95 ? '⚠️ Budget almost exhausted!' : '⚡ You\'ve used 75% of your budget'}
          </p>
        )}
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card-base space-y-4 border-primary/30 bg-primary/5 animate-slide-up">
          <h3 className="font-bold text-foreground">New Expense</h3>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Amount (₹)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="pl-7 h-11 rounded-xl"
                min="0"
                step="0.01"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    <span className="flex items-center gap-2">
                      {categoryIcons[cat]} {cat}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Note (optional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you spend on?"
              className="h-11 rounded-xl"
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full h-11 rounded-xl font-bold">
            {isPending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding...
              </span>
            ) : (
              'Add Expense'
            )}
          </Button>
        </form>
      )}

      {/* Expense History */}
      {expensesLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : (expenses ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <img
            src="/assets/generated/empty-expenses.dim_300x200.png"
            alt="No expenses"
            className="w-48 h-32 object-contain opacity-80"
          />
          <p className="text-muted-foreground font-medium">No expenses yet</p>
          <p className="text-xs text-muted-foreground">Tap "Add" to log your first expense</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ label, expenses: groupExpenses }) => (
            <div key={label}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">{label}</p>
              <div className="card-base space-y-3 p-3">
                {groupExpenses.map((expense: Expense, i: number) => {
                  const dateMs = Number(expense.date) / 1_000_000;
                  const dateObj = new Date(dateMs);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${categoryColors[expense.category] || categoryColors.Other}`}>
                        {categoryIcons[expense.category] || categoryIcons.Other}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{expense.category}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {expense.note || dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-destructive flex-shrink-0">
                        -₹{formatINR(expense.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
