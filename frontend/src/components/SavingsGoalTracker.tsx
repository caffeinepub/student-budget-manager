import { useState } from 'react';
import { useGetSavingsGoals, useAddSavingsGoal, useGetLockerStatus } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import GoalCard from './GoalCard';
import { toast } from 'sonner';
import { Plus, X, Lock, Shield } from 'lucide-react';

export default function SavingsGoalTracker() {
  const { data: goals, isLoading } = useGetSavingsGoals();
  const { data: lockerStatus } = useGetLockerStatus();
  const { mutateAsync: addGoal, isPending } = useAddSavingsGoal();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [useLocker, setUseLocker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Enter a goal name'); return; }
    const targetAmt = parseFloat(target);
    if (!targetAmt || targetAmt <= 0) { toast.error('Enter a valid target amount'); return; }

    let deadlineBigInt = BigInt(0);
    if (deadline) {
      const deadlineDate = new Date(deadline);
      deadlineBigInt = BigInt(deadlineDate.getTime()) * BigInt(1_000_000);
    }

    try {
      await addGoal({ name: name.trim(), target: targetAmt, deadline: deadlineBigInt });
      toast.success(`Goal "${name}" created! 🎯`);
      setName('');
      setTarget('');
      setDeadline('');
      setUseLocker(false);
      setShowForm(false);
    } catch {
      toast.error('Failed to create goal');
    }
  };

  return (
    <div className="page-content space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">Savings Goals</h1>
          <p className="text-xs text-muted-foreground">Track your financial targets</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="rounded-xl h-9 gap-1.5"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New Goal'}
        </Button>
      </div>

      {/* Digital Locker Status */}
      <div className={`card-base flex items-center gap-3 ${lockerStatus?.locked ? 'border-warning/30 bg-warning/5' : 'border-success/30 bg-success/5'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lockerStatus?.locked ? 'bg-warning/10' : 'bg-success/10'}`}>
          {lockerStatus?.locked ? <Lock size={18} className="text-warning" /> : <Shield size={18} className="text-success" />}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Digital Locker</p>
          <p className="text-xs text-muted-foreground">
            {lockerStatus?.locked
              ? 'Savings are locked — protected from spending'
              : 'Savings are accessible'}
          </p>
        </div>
      </div>

      {/* Create Goal Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card-base space-y-4 border-primary/30 bg-primary/5 animate-slide-up">
          <h3 className="font-bold text-foreground">New Savings Goal</h3>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Goal Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New Laptop, Trip to Goa..."
              className="h-11 rounded-xl"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Target Amount (₹)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
              <Input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="0"
                className="pl-7 h-11 rounded-xl"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Deadline (optional)</Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-11 rounded-xl"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-warning/10 rounded-xl">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-warning" />
              <div>
                <p className="text-sm font-semibold text-foreground">Enable Digital Locker</p>
                <p className="text-xs text-muted-foreground">Lock savings until goal is met</p>
              </div>
            </div>
            <Switch checked={useLocker} onCheckedChange={setUseLocker} />
          </div>

          <Button type="submit" disabled={isPending} className="w-full h-11 rounded-xl font-bold">
            {isPending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              'Create Goal 🎯'
            )}
          </Button>
        </form>
      )}

      {/* Digital Locker Illustration */}
      {!showForm && (goals ?? []).length === 0 && (
        <div className="card-base text-center space-y-3 py-6">
          <img
            src="/assets/generated/locker-illustration.dim_400x300.png"
            alt="Digital Locker"
            className="w-40 h-28 object-contain mx-auto opacity-90"
          />
          <div>
            <p className="font-bold text-foreground">Digital Locker</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Create savings goals and lock them with the Digital Locker.
              Your savings stay safe until you reach your target!
            </p>
          </div>
        </div>
      )}

      {/* Goals List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : (goals ?? []).length === 0 && showForm === false ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <img
            src="/assets/generated/empty-goals.dim_300x200.png"
            alt="No goals"
            className="w-48 h-32 object-contain opacity-80"
          />
          <p className="text-muted-foreground font-medium">No savings goals yet</p>
          <p className="text-xs text-muted-foreground">Tap "New Goal" to create your first target</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(goals ?? []).map((goal, i) => (
            <GoalCard key={i} goal={goal} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
