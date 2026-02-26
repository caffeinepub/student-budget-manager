import React from 'react';
import { Shield, Users, Wallet, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useGetAllWalletSummaries } from '../hooks/useQueries';
import { KycStatus } from '../backend';

function formatINR(amount: bigint | number): string {
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num);
}

function truncatePrincipal(p: { toString(): string }): string {
  const s = p.toString();
  if (s.length <= 16) return s;
  return `${s.slice(0, 8)}...${s.slice(-6)}`;
}

function KYCBadge({ status }: { status: KycStatus }) {
  if (status === KycStatus.full) {
    return <Badge className="bg-success/10 text-success border-success/30 text-[10px]">Full KYC</Badge>;
  }
  if (status === KycStatus.basic) {
    return <Badge className="bg-warning/10 text-warning border-warning/30 text-[10px]">Basic KYC</Badge>;
  }
  return <Badge variant="outline" className="text-[10px] text-muted-foreground">None</Badge>;
}

export default function AdminPanel() {
  const { data, isLoading, error } = useGetAllWalletSummaries();

  const isUnauthorized = error instanceof Error && error.message === 'UNAUTHORIZED';

  return (
    <div className="page-content space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Shield size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">Wallet system overview</p>
        </div>
      </div>

      {/* Unauthorized */}
      {isUnauthorized && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle size={20} className="text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Access Denied</p>
            <p className="text-xs text-muted-foreground mt-1">
              You do not have admin privileges to view this panel. Only the system administrator can access wallet summaries.
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      )}

      {/* Data */}
      {data && !isLoading && (
        <>
          {/* System Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users size={14} className="text-primary" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Users</span>
              </div>
              <p className="text-3xl font-bold">{Number(data[1].totalUsers)}</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl bg-invest/10 flex items-center justify-center">
                  <Wallet size={14} className="text-invest" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Balance</span>
              </div>
              <p className="text-2xl font-bold">₹{formatINR(data[1].totalBalance)}</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Shield size={14} className="text-warning" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Basic KYC</span>
              </div>
              <p className="text-3xl font-bold">{Number(data[1].basicKycCount)}</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl bg-success/10 flex items-center justify-center">
                  <ShieldCheck size={14} className="text-success" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full KYC</span>
              </div>
              <p className="text-3xl font-bold">{Number(data[1].fullKycCount)}</p>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <h2 className="text-sm font-semibold">All Wallet Users</h2>
              <p className="text-xs text-muted-foreground">{data[0].length} wallet(s) found</p>
            </div>

            {data[0].length === 0 ? (
              <div className="px-4 pb-6 text-center">
                <ShieldAlert size={24} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No wallets created yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Principal</TableHead>
                      <TableHead className="text-xs text-right">Balance</TableHead>
                      <TableHead className="text-xs text-center">KYC</TableHead>
                      <TableHead className="text-xs text-right">Txns</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data[0].map((summary, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-[10px] text-muted-foreground">
                          {truncatePrincipal(summary.principal)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold">
                          ₹{formatINR(summary.balance)}
                        </TableCell>
                        <TableCell className="text-center">
                          <KYCBadge status={summary.kycStatus} />
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {Number(summary.transactionCount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="pb-6 text-center">
        <p className="text-[10px] text-muted-foreground">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium"
          >
            caffeine.ai
          </a>{' '}
          · © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
