import { useRouter } from '@tanstack/react-router';
import { useGetInvestmentSuggestions, useGetProfile } from '../hooks/useQueries';
import InvestmentCard from './InvestmentCard';
import ProjectionTable from './ProjectionTable';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Settings } from 'lucide-react';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
}

const STATIC_SUGGESTIONS = [
  {
    key: 'rd',
    name: 'Recurring Deposit (RD)',
    description: 'A safe bank deposit where you invest a fixed amount monthly. Guaranteed returns, zero risk. Perfect for beginners.',
    returnRange: '6–7%',
    annualRate: 6.5,
    riskLevel: 'Very Low' as const,
    icon: '🏦',
    minAmount: 500,
  },
  {
    key: 'ppf',
    name: 'Public Provident Fund (PPF)',
    description: 'Government-backed long-term savings scheme with tax benefits. Lock-in of 15 years but partial withdrawals allowed after 7 years.',
    returnRange: '7–8%',
    annualRate: 7.1,
    riskLevel: 'Very Low' as const,
    icon: '🏛️',
    minAmount: 500,
  },
  {
    key: 'index',
    name: 'Index Fund SIP',
    description: 'Invest in a basket of top stocks via Systematic Investment Plan. Low cost, diversified, and historically outperforms inflation.',
    returnRange: '10–12%',
    annualRate: 11,
    riskLevel: 'Low' as const,
    icon: '📈',
    minAmount: 100,
  },
];

export default function InvestmentSuggestions() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: suggestions, isLoading: suggestionsLoading } = useGetInvestmentSuggestions();

  const totalIncome = profile?.incomeSources.reduce((sum, s) => sum + s.amount, 0) ?? 0;
  const investingPct = profile?.allocation.investingPct ?? 20;
  const monthlyInvestment = (totalIncome * investingPct) / 100;

  const isLoading = profileLoading || suggestionsLoading;

  // Map backend suggestions to amounts
  const backendAmounts: Record<string, number> = {};
  if (suggestions) {
    suggestions.forEach(([name, amount]) => {
      backendAmounts[name] = amount;
    });
  }

  return (
    <div className="page-content space-y-5 animate-slide-up">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-foreground">Investments</h1>
        <p className="text-xs text-muted-foreground">Low-risk options for students</p>
      </div>

      {/* Monthly Investment Banner */}
      {isLoading ? (
        <Skeleton className="h-20 rounded-2xl" />
      ) : monthlyInvestment === 0 ? (
        <div className="card-base border-warning/30 bg-warning/5 flex items-start gap-3">
          <AlertCircle size={18} className="text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">No Investment Budget Set</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your current allocation has ₹0 for investments. Adjust your budget split to start investing.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.navigate({ to: '/onboarding' })}
              className="mt-2 h-8 rounded-xl text-xs gap-1.5"
            >
              <Settings size={12} /> Adjust Allocation
            </Button>
          </div>
        </div>
      ) : (
        <div className="gradient-invest rounded-2xl p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
          <p className="text-xs text-white/75 uppercase tracking-wide font-semibold">Monthly Investment</p>
          <p className="text-3xl font-bold mt-1">₹{formatINR(monthlyInvestment)}</p>
          <p className="text-xs text-white/75 mt-1">{investingPct}% of ₹{formatINR(totalIncome)} income</p>
        </div>
      )}

      {/* Investment Cards */}
      <div className="space-y-3">
        <h2 className="font-bold text-foreground text-sm">Recommended Options</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
          </div>
        ) : (
          STATIC_SUGGESTIONS.map((suggestion) => (
            <InvestmentCard
              key={suggestion.key}
              name={suggestion.name}
              description={suggestion.description}
              minimumAmount={suggestion.minAmount}
              returnRange={suggestion.returnRange}
              riskLevel={suggestion.riskLevel}
              icon={suggestion.icon}
              monthlyAmount={monthlyInvestment > 0 ? monthlyInvestment * (suggestion.key === 'rd' ? 0.5 : suggestion.key === 'ppf' ? 0.3 : 0.2) : undefined}
            />
          ))
        )}
      </div>

      {/* Projection Tables */}
      {monthlyInvestment > 0 && (
        <div className="space-y-4">
          <h2 className="font-bold text-foreground text-sm">Growth Projections</h2>
          {STATIC_SUGGESTIONS.map((suggestion) => {
            const alloc = suggestion.key === 'rd' ? 0.5 : suggestion.key === 'ppf' ? 0.3 : 0.2;
            const monthly = monthlyInvestment * alloc;
            return (
              <div key={suggestion.key} className="card-base">
                <ProjectionTable
                  monthlyAmount={monthly}
                  annualReturnRate={suggestion.annualRate}
                  label={suggestion.name}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Disclaimer */}
      <div className="card-base bg-muted/50 border-muted">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>Disclaimer:</strong> Investment suggestions are for educational purposes only. Past returns do not guarantee future performance. Consult a financial advisor before investing.
        </p>
      </div>
    </div>
  );
}
