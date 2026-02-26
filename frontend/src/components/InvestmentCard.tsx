import { Badge } from '@/components/ui/badge';
import { TrendingUp, Info } from 'lucide-react';

interface InvestmentCardProps {
  name: string;
  description: string;
  minimumAmount: number;
  returnRange: string;
  riskLevel: 'Very Low' | 'Low';
  icon: string;
  monthlyAmount?: number;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
}

export default function InvestmentCard({
  name,
  description,
  minimumAmount,
  returnRange,
  riskLevel,
  icon,
  monthlyAmount,
}: InvestmentCardProps) {
  return (
    <div className="card-base space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-invest/10 flex items-center justify-center text-xl">
            {icon}
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">{name}</p>
            <Badge
              variant={riskLevel === 'Very Low' ? 'secondary' : 'outline'}
              className="text-[10px] px-1.5 py-0 mt-0.5"
            >
              {riskLevel} Risk
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-success">
            <TrendingUp size={12} />
            <span className="text-xs font-bold">{returnRange}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">annual return</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>

      <div className="flex items-center justify-between bg-muted/50 rounded-xl p-2.5">
        <div className="flex items-center gap-1.5">
          <Info size={12} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Min. monthly</span>
        </div>
        <span className="text-xs font-bold text-foreground">₹{formatINR(minimumAmount)}</span>
      </div>

      {monthlyAmount !== undefined && monthlyAmount > 0 && (
        <div className="bg-invest/10 rounded-xl p-2.5 flex items-center justify-between">
          <span className="text-xs text-invest font-medium">Your monthly allocation</span>
          <span className="text-xs font-bold text-invest">₹{formatINR(monthlyAmount)}</span>
        </div>
      )}
    </div>
  );
}
