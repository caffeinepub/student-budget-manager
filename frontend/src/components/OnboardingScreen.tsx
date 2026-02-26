import { useState, useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useAddIncome, useSetAllocationSplit, useGetProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { IndianRupee, ChevronRight, Wallet, PiggyBank, TrendingUp } from 'lucide-react';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetProfile();

  const [pocketMoney, setPocketMoney] = useState('');
  const [stipend, setStipend] = useState('');
  const [partTime, setPartTime] = useState('');
  const [spending, setSpending] = useState(50);
  const [saving, setSaving] = useState(30);
  const [investing, setInvesting] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync: addIncome } = useAddIncome();
  const { mutateAsync: setAllocation } = useSetAllocationSplit();

  // Redirect to dashboard if already has income
  useEffect(() => {
    if (profile && profile.incomeSources.length > 0) {
      router.navigate({ to: '/' });
    }
  }, [profile, router]);

  const totalIncome =
    (parseFloat(pocketMoney) || 0) +
    (parseFloat(stipend) || 0) +
    (parseFloat(partTime) || 0);

  const spendingAmt = (totalIncome * spending) / 100;
  const savingAmt = (totalIncome * saving) / 100;
  const investingAmt = (totalIncome * investing) / 100;

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dailySpend = spendingAmt / daysInMonth;

  const handleSpendingChange = (val: number) => {
    const remaining = 100 - val;
    const ratio = saving / (saving + investing) || 0.6;
    setSpending(val);
    setSaving(Math.round(remaining * ratio));
    setInvesting(Math.round(remaining * (1 - ratio)));
  };

  const handleSavingChange = (val: number) => {
    const remaining = 100 - spending;
    if (val > remaining) return;
    setSaving(val);
    setInvesting(remaining - val);
  };

  const handleInvestingChange = (val: number) => {
    const remaining = 100 - spending;
    if (val > remaining) return;
    setInvesting(val);
    setSaving(remaining - val);
  };

  const handleSubmit = async () => {
    if (totalIncome <= 0) {
      toast.error('Please enter at least one income source');
      return;
    }
    if (spending + saving + investing !== 100) {
      toast.error('Allocation must sum to 100%');
      return;
    }

    setIsSubmitting(true);
    try {
      const sources = [
        { name: 'Pocket Money', amount: parseFloat(pocketMoney) || 0 },
        { name: 'Stipend', amount: parseFloat(stipend) || 0 },
        { name: 'Part-time Income', amount: parseFloat(partTime) || 0 },
      ].filter((s) => s.amount > 0);

      for (const source of sources) {
        await addIncome({ name: source.name, amount: source.amount });
      }

      await setAllocation({ spending, saving, investing });
      toast.success('Budget set up successfully! 🎉');
      router.navigate({ to: '/' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Setup failed';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content space-y-6 animate-slide-up">
      {/* Header */}
      <div className="pt-4 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <img
            src="/assets/generated/logo.dim_256x256.png"
            alt="Logo"
            className="w-10 h-10 rounded-2xl object-cover"
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">Set Up Your Budget</h1>
            <p className="text-xs text-muted-foreground">Enter your monthly income sources</p>
          </div>
        </div>
      </div>

      {/* Income Sources */}
      <div className="card-base space-y-4">
        <h2 className="font-bold text-foreground flex items-center gap-2">
          <IndianRupee size={16} className="text-primary" />
          Monthly Income
        </h2>

        {[
          { label: 'Pocket Money', value: pocketMoney, setter: setPocketMoney, placeholder: '0' },
          { label: 'Stipend / Scholarship', value: stipend, setter: setStipend, placeholder: '0' },
          { label: 'Part-time Income', value: partTime, setter: setPartTime, placeholder: '0' },
        ].map(({ label, value, setter, placeholder }) => (
          <div key={label} className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">{label}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
              <Input
                type="number"
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="pl-7 h-11 rounded-xl"
                min="0"
              />
            </div>
          </div>
        ))}

        {totalIncome > 0 && (
          <div className="bg-primary/10 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-primary">Total Monthly Income</span>
            <span className="text-lg font-bold text-primary">₹{formatINR(totalIncome)}</span>
          </div>
        )}
      </div>

      {/* Allocation Sliders */}
      <div className="card-base space-y-5">
        <h2 className="font-bold text-foreground">Budget Split</h2>
        <p className="text-xs text-muted-foreground -mt-3">
          Total: {spending + saving + investing}% {spending + saving + investing !== 100 && <span className="text-destructive">(must be 100%)</span>}
        </p>

        {/* Spending */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-spending flex items-center justify-center">
                <Wallet size={14} className="text-white" />
              </div>
              <span className="text-sm font-semibold">Spending</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-foreground">{spending}%</span>
              {totalIncome > 0 && <p className="text-xs text-muted-foreground">₹{formatINR(spendingAmt)}/mo</p>}
            </div>
          </div>
          <Slider
            value={[spending]}
            onValueChange={([v]) => handleSpendingChange(v)}
            min={10}
            max={80}
            step={1}
            className="w-full"
          />
        </div>

        {/* Saving */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-saving flex items-center justify-center">
                <PiggyBank size={14} className="text-white" />
              </div>
              <span className="text-sm font-semibold">Saving</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-foreground">{saving}%</span>
              {totalIncome > 0 && <p className="text-xs text-muted-foreground">₹{formatINR(savingAmt)}/mo</p>}
            </div>
          </div>
          <Slider
            value={[saving]}
            onValueChange={([v]) => handleSavingChange(v)}
            min={5}
            max={100 - spending - 5}
            step={1}
            className="w-full"
          />
        </div>

        {/* Investing */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-invest flex items-center justify-center">
                <TrendingUp size={14} className="text-white" />
              </div>
              <span className="text-sm font-semibold">Investing</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-foreground">{investing}%</span>
              {totalIncome > 0 && <p className="text-xs text-muted-foreground">₹{formatINR(investingAmt)}/mo</p>}
            </div>
          </div>
          <Slider
            value={[investing]}
            onValueChange={([v]) => handleInvestingChange(v)}
            min={5}
            max={100 - spending - 5}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Summary */}
      {totalIncome > 0 && (
        <div className="card-base bg-primary/5 border-primary/20 space-y-2">
          <h3 className="text-sm font-bold text-primary">Daily Spend Limit</h3>
          <p className="text-2xl font-bold text-foreground">₹{formatINR(dailySpend)}<span className="text-sm font-normal text-muted-foreground">/day</span></p>
          <p className="text-xs text-muted-foreground">Based on ₹{formatINR(spendingAmt)} spending budget over {daysInMonth} days</p>
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || totalIncome <= 0 || spending + saving + investing !== 100}
        className="w-full h-14 rounded-2xl font-bold text-base"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Confirm & Save <ChevronRight size={18} />
          </span>
        )}
      </Button>
    </div>
  );
}
