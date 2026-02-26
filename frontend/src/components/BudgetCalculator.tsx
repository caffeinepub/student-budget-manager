import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Wallet, PiggyBank, TrendingUp, Calculator } from 'lucide-react';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
}

const EXPENSE_CATEGORIES = [
  { name: 'Food & Groceries', pct: 40, color: 'bg-orange-400' },
  { name: 'Transport', pct: 25, color: 'bg-blue-400' },
  { name: 'Education & Books', pct: 20, color: 'bg-purple-400' },
  { name: 'Entertainment', pct: 15, color: 'bg-pink-400' },
];

export default function BudgetCalculator() {
  const [income, setIncome] = useState('10000');
  const [spending, setSpending] = useState(50);
  const [saving, setSaving] = useState(30);
  const [investing, setInvesting] = useState(20);

  const totalIncome = parseFloat(income) || 0;
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

  const total = spending + saving + investing;

  return (
    <div className="page-content space-y-5 animate-slide-up">
      {/* Header */}
      <div className="pt-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center">
          <Calculator size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Budget Calculator</h1>
          <p className="text-xs text-muted-foreground">Instant calculations — no data saved</p>
        </div>
      </div>

      {/* Income Input */}
      <div className="card-base space-y-3">
        <Label className="text-sm font-bold text-foreground">Monthly Income</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
          <Input
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="pl-7 h-12 rounded-xl text-lg font-bold"
            min="0"
          />
        </div>
      </div>

      {/* Allocation Sliders */}
      <div className="card-base space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground">Budget Split</h2>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${total === 100 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
            {total}%
          </span>
        </div>

        {[
          { label: 'Spending', value: spending, onChange: handleSpendingChange, amount: spendingAmt, icon: <Wallet size={14} className="text-white" />, gradient: 'gradient-spending' },
          { label: 'Saving', value: saving, onChange: handleSavingChange, amount: savingAmt, icon: <PiggyBank size={14} className="text-white" />, gradient: 'gradient-saving' },
          { label: 'Investing', value: investing, onChange: handleInvestingChange, amount: investingAmt, icon: <TrendingUp size={14} className="text-white" />, gradient: 'gradient-invest' },
        ].map(({ label, value, onChange, amount, icon, gradient }) => (
          <div key={label} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg ${gradient} flex items-center justify-center`}>
                  {icon}
                </div>
                <span className="text-sm font-semibold text-foreground">{label}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold">{value}%</span>
                {totalIncome > 0 && <p className="text-xs text-muted-foreground">₹{formatINR(amount)}</p>}
              </div>
            </div>
            <Slider
              value={[value]}
              onValueChange={([v]) => onChange(v)}
              min={5}
              max={85}
              step={1}
            />
          </div>
        ))}
      </div>

      {/* Results */}
      {totalIncome > 0 && (
        <>
          {/* Daily Spend */}
          <div className="gradient-spending rounded-2xl p-4 text-white">
            <p className="text-xs text-white/75 uppercase tracking-wide font-semibold">Daily Spend Limit</p>
            <p className="text-3xl font-bold mt-1">₹{formatINR(dailySpend)}<span className="text-sm font-normal text-white/75">/day</span></p>
            <p className="text-xs text-white/75 mt-1">₹{formatINR(spendingAmt)} ÷ {daysInMonth} days</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card-base text-center space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Monthly Savings</p>
              <p className="text-xl font-bold text-success">₹{formatINR(savingAmt)}</p>
              <p className="text-xs text-muted-foreground">Yearly: ₹{formatINR(savingAmt * 12)}</p>
            </div>
            <div className="card-base text-center space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Monthly Investment</p>
              <p className="text-xl font-bold text-invest">₹{formatINR(investingAmt)}</p>
              <p className="text-xs text-muted-foreground">Yearly: ₹{formatINR(investingAmt * 12)}</p>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="card-base space-y-3">
            <h3 className="font-bold text-foreground text-sm">Recommended Spending Breakdown</h3>
            <div className="space-y-2.5">
              {EXPENSE_CATEGORIES.map(({ name, pct, color }) => {
                const catAmt = (spendingAmt * pct) / 100;
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-foreground">{name}</span>
                      <span className="font-bold text-foreground">₹{formatINR(catAmt)} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <Separator />
            <div className="flex justify-between text-xs font-bold">
              <span className="text-foreground">Total Spending</span>
              <span className="text-foreground">₹{formatINR(spendingAmt)}</span>
            </div>
          </div>

          {/* Sample Calculation */}
          <div className="card-base bg-muted/50 space-y-2">
            <h3 className="font-bold text-foreground text-sm">📊 Sample Calculation</h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Monthly Income: <strong className="text-foreground">₹{formatINR(totalIncome)}</strong></p>
              <p>Spending ({spending}%): <strong className="text-foreground">₹{formatINR(spendingAmt)}</strong> → ₹{formatINR(dailySpend)}/day</p>
              <p>Saving ({saving}%): <strong className="text-foreground">₹{formatINR(savingAmt)}</strong> → ₹{formatINR(savingAmt * 12)}/year</p>
              <p>Investing ({investing}%): <strong className="text-foreground">₹{formatINR(investingAmt)}</strong> → ₹{formatINR(investingAmt * 12)}/year</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
