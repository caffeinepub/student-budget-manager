import { useState } from 'react';
import { useUpdateSavingsGoal, useRequestUnlock } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Lock, LockOpen, Target, Calendar, Plus } from 'lucide-react';
import type { SavingsGoal } from '../backend';

interface GoalCardProps {
  goal: SavingsGoal;
  index: number;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
}

export default function GoalCard({ goal, index }: GoalCardProps) {
  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUp, setShowTopUp] = useState(false);
  const { mutateAsync: updateGoal, isPending: isUpdating } = useUpdateSavingsGoal();
  const { mutateAsync: requestUnlock, isPending: isUnlocking } = useRequestUnlock();

  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const isGoalMet = goal.currentAmount >= goal.targetAmount;

  const deadlineMs = Number(goal.deadline) / 1_000_000;
  const deadlineDate = new Date(deadlineMs);
  const hasDeadline = deadlineMs > 0;
  const daysLeft = hasDeadline
    ? Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleTopUp = async () => {
    const amt = parseFloat(topUpAmount);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      await updateGoal({ index: BigInt(index), amount: amt });
      toast.success(`₹${formatINR(amt)} added to "${goal.name}"`);
      setTopUpAmount('');
      setShowTopUp(false);
    } catch {
      toast.error('Failed to top up goal');
    }
  };

  const handleUnlock = async () => {
    try {
      const success = await requestUnlock({
        conditionType: 'goal-met',
        goalIndex: BigInt(index),
        periodDays: null,
      });
      if (success) {
        toast.success('🔓 Goal unlocked! Savings are now accessible.');
      } else {
        toast.error('Goal not yet met. Keep saving!');
      }
    } catch {
      toast.error('Unlock failed. Try again.');
    }
  };

  return (
    <div className="card-base space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center">
            <Target size={18} className="text-success" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">{goal.name}</p>
            {hasDeadline && daysLeft !== null && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar size={10} />
                <span>{daysLeft > 0 ? `${daysLeft}d left` : 'Deadline passed'}</span>
              </div>
            )}
          </div>
        </div>
        <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${goal.locked ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
          {goal.locked ? <Lock size={10} /> : <LockOpen size={10} />}
          {goal.locked ? 'Locked' : 'Open'}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">₹{formatINR(goal.currentAmount)} saved</span>
          <span className="font-semibold text-foreground">₹{formatINR(goal.targetAmount)} goal</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isGoalMet ? 'bg-success' : 'bg-primary'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-right font-medium text-muted-foreground">{Math.min(progress, 100).toFixed(0)}% complete</p>
      </div>

      {/* Locked message */}
      {goal.locked && (
        <div className="bg-warning/10 rounded-xl p-2.5 flex items-center gap-2">
          <Lock size={14} className="text-warning flex-shrink-0" />
          <p className="text-xs text-warning font-medium">Locked — cannot withdraw until goal is met</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!showTopUp ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTopUp(true)}
            className="flex-1 rounded-xl h-9 gap-1.5 text-xs font-semibold"
          >
            <Plus size={14} /> Top Up
          </Button>
        ) : (
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
              <Input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="Amount"
                className="pl-6 h-9 rounded-xl text-sm"
                autoFocus
              />
            </div>
            <Button size="sm" onClick={handleTopUp} disabled={isUpdating} className="rounded-xl h-9 px-3">
              {isUpdating ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Add'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowTopUp(false)} className="rounded-xl h-9 px-2">
              <span className="text-xs">✕</span>
            </Button>
          </div>
        )}

        {goal.locked && isGoalMet && (
          <Button
            size="sm"
            onClick={handleUnlock}
            disabled={isUnlocking}
            className="rounded-xl h-9 gap-1.5 text-xs font-semibold bg-success hover:bg-success/90"
          >
            {isUnlocking ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LockOpen size={14} /> Unlock</>}
          </Button>
        )}
      </div>
    </div>
  );
}
