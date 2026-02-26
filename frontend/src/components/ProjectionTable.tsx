interface ProjectionTableProps {
  monthlyAmount: number;
  annualReturnRate: number;
  label: string;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
}

function calculateFV(monthlyAmount: number, annualRate: number, years: number): number {
  const r = annualRate / 12 / 100;
  const n = years * 12;
  if (r === 0) return monthlyAmount * n;
  return monthlyAmount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

export default function ProjectionTable({ monthlyAmount, annualReturnRate, label }: ProjectionTableProps) {
  const projections = [1, 3, 5].map((years) => ({
    years,
    invested: monthlyAmount * years * 12,
    value: calculateFV(monthlyAmount, annualReturnRate, years),
  }));

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label} — Growth Projection</p>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2.5 font-semibold text-muted-foreground">Period</th>
              <th className="text-right p-2.5 font-semibold text-muted-foreground">Invested</th>
              <th className="text-right p-2.5 font-semibold text-success">Value</th>
            </tr>
          </thead>
          <tbody>
            {projections.map(({ years, invested, value }) => (
              <tr key={years} className="border-t border-border">
                <td className="p-2.5 font-medium text-foreground">{years} Year{years > 1 ? 's' : ''}</td>
                <td className="p-2.5 text-right text-muted-foreground">₹{formatINR(invested)}</td>
                <td className="p-2.5 text-right font-bold text-success">₹{formatINR(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground">
        * Projected at {annualReturnRate}% annual return. Actual returns may vary.
      </p>
    </div>
  );
}
