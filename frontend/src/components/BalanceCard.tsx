import { Lock, LockOpen } from 'lucide-react';
import React from 'react';

interface BalanceCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  gradientClass: string;
  icon: React.ReactNode;
  locked?: boolean;
  badge?: string;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
}

export default function BalanceCard({
  title,
  amount,
  subtitle,
  gradientClass,
  icon,
  locked,
  badge,
}: BalanceCardProps) {
  return (
    <div className={`${gradientClass} rounded-2xl p-4 text-white relative overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 -translate-y-6 translate-x-6" />
      <div className="absolute bottom-0 left-0 w-12 h-12 rounded-full bg-white/10 translate-y-4 -translate-x-4" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              {icon}
            </div>
            <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">{title}</span>
          </div>
          {locked !== undefined && (
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
              {locked ? <Lock size={10} /> : <LockOpen size={10} />}
              <span className="text-[10px] font-semibold">{locked ? 'Locked' : 'Open'}</span>
            </div>
          )}
        </div>

        <p className="text-2xl font-bold tracking-tight">₹{formatINR(amount)}</p>

        {subtitle && (
          <p className="text-xs text-white/75 mt-1">{subtitle}</p>
        )}

        {badge && (
          <div className="mt-2 inline-block bg-white/20 rounded-full px-2 py-0.5">
            <span className="text-[10px] font-semibold">{badge}</span>
          </div>
        )}
      </div>
    </div>
  );
}
