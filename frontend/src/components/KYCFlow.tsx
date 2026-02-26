import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useGetKYCStatus, useSubmitBasicKYC, useSubmitFullKYC } from '../hooks/useQueries';
import { KycStatus } from '../backend';
import { toast } from 'sonner';
import ComplianceNotice from './ComplianceNotice';

function KYCStatusBadge({ status }: { status: KycStatus }) {
  if (status === KycStatus.full) {
    return (
      <div className="flex items-center gap-2 bg-success/10 border border-success/30 rounded-xl px-3 py-2">
        <ShieldCheck size={16} className="text-success" />
        <span className="text-sm font-semibold text-success">Full KYC Verified</span>
      </div>
    );
  }
  if (status === KycStatus.basic) {
    return (
      <div className="flex items-center gap-2 bg-warning/10 border border-warning/30 rounded-xl px-3 py-2">
        <Shield size={16} className="text-warning" />
        <span className="text-sm font-semibold text-warning">Basic KYC Completed</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 bg-muted border border-border rounded-xl px-3 py-2">
      <ShieldAlert size={16} className="text-muted-foreground" />
      <span className="text-sm font-semibold text-muted-foreground">Not Verified</span>
    </div>
  );
}

function TransactionLimitsInfo({ status }: { status: KycStatus }) {
  return (
    <div className="bg-muted/40 rounded-xl p-3 space-y-1.5">
      <p className="text-xs font-semibold text-foreground">Transaction Limits</p>
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <span className={status === KycStatus.none ? 'text-primary font-semibold' : ''}>No KYC</span>
          </span>
          <span>₹10,000 / month</span>
        </div>
        <div className="flex justify-between">
          <span className={status === KycStatus.basic ? 'text-primary font-semibold' : ''}>Basic KYC</span>
          <span>₹1,00,000 / month</span>
        </div>
        <div className="flex justify-between">
          <span className={status === KycStatus.full ? 'text-primary font-semibold' : ''}>Full KYC</span>
          <span>₹2,00,000 / month</span>
        </div>
      </div>
    </div>
  );
}

export default function KYCFlow() {
  const { data: kycStatus, isLoading } = useGetKYCStatus();
  const submitBasicKYC = useSubmitBasicKYC();
  const submitFullKYC = useSubmitFullKYC();

  // Basic KYC form state
  const [basicName, setBasicName] = useState('');
  const [basicDob, setBasicDob] = useState('');
  const [basicPhone, setBasicPhone] = useState('');
  const [basicAadhaar, setBasicAadhaar] = useState('');

  // Full KYC form state
  const [fullAddress, setFullAddress] = useState('');
  const [fullPhotoId, setFullPhotoId] = useState('');

  const handleBasicKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!basicName.trim() || !basicDob || !basicPhone.trim() || basicAadhaar.length !== 4) {
      toast.error('Please fill all fields correctly. Aadhaar must be exactly 4 digits.');
      return;
    }
    try {
      await submitBasicKYC.mutateAsync({
        name: basicName.trim(),
        dob: basicDob,
        phone: basicPhone.trim(),
        aadhaarLast4: basicAadhaar,
      });
      toast.success('Basic KYC submitted successfully!');
      setBasicName('');
      setBasicDob('');
      setBasicPhone('');
      setBasicAadhaar('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      toast.error(msg.includes('not found') ? 'Please create a wallet first.' : 'KYC submission failed.');
    }
  };

  const handleFullKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullAddress.trim() || !fullPhotoId.trim()) {
      toast.error('Please fill all fields.');
      return;
    }
    try {
      await submitFullKYC.mutateAsync({
        address: fullAddress.trim(),
        photoIdRef: fullPhotoId.trim(),
      });
      toast.success('Full KYC submitted successfully!');
      setFullAddress('');
      setFullPhotoId('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      toast.error(msg.includes('Basic KYC') ? 'Complete Basic KYC first.' : 'Full KYC submission failed.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 bg-muted rounded-xl" />
        <div className="h-32 bg-muted rounded-xl" />
      </div>
    );
  }

  const status = kycStatus ?? KycStatus.none;

  return (
    <div className="space-y-4">
      <ComplianceNotice />

      {/* Status Badge */}
      <KYCStatusBadge status={status} />

      {/* Transaction Limits */}
      <TransactionLimitsInfo status={status} />

      {/* Basic KYC Form */}
      {status === KycStatus.none && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Complete Basic KYC</p>
              <p className="text-xs text-muted-foreground">Increase your transaction limit</p>
            </div>
          </div>

          <form onSubmit={handleBasicKYC} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="kyc-name" className="text-xs">Full Name</Label>
              <Input
                id="kyc-name"
                placeholder="As per Aadhaar card"
                value={basicName}
                onChange={e => setBasicName(e.target.value)}
                className="h-10 rounded-xl text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kyc-dob" className="text-xs">Date of Birth</Label>
              <Input
                id="kyc-dob"
                type="date"
                value={basicDob}
                onChange={e => setBasicDob(e.target.value)}
                className="h-10 rounded-xl text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kyc-phone" className="text-xs">Phone Number</Label>
              <Input
                id="kyc-phone"
                type="tel"
                placeholder="10-digit mobile number"
                value={basicPhone}
                onChange={e => setBasicPhone(e.target.value)}
                className="h-10 rounded-xl text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kyc-aadhaar" className="text-xs">Aadhaar Last 4 Digits</Label>
              <Input
                id="kyc-aadhaar"
                placeholder="XXXX"
                value={basicAadhaar}
                onChange={e => setBasicAadhaar(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                className="h-10 rounded-xl text-sm"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl"
              disabled={submitBasicKYC.isPending}
            >
              {submitBasicKYC.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit Basic KYC'
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Full KYC Form */}
      {status === KycStatus.basic && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center">
              <ShieldCheck size={16} className="text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold">Upgrade to Full KYC</p>
              <p className="text-xs text-muted-foreground">Maximum transaction limits</p>
            </div>
          </div>

          <form onSubmit={handleFullKYC} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="kyc-address" className="text-xs">Full Address</Label>
              <Textarea
                id="kyc-address"
                placeholder="House/Flat No., Street, City, State, PIN"
                value={fullAddress}
                onChange={e => setFullAddress(e.target.value)}
                className="rounded-xl text-sm resize-none"
                rows={3}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kyc-photoid" className="text-xs">Photo ID Reference</Label>
              <Input
                id="kyc-photoid"
                placeholder="e.g. PAN: ABCDE1234F or Passport No."
                value={fullPhotoId}
                onChange={e => setFullPhotoId(e.target.value)}
                className="h-10 rounded-xl text-sm"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl"
              disabled={submitFullKYC.isPending}
            >
              {submitFullKYC.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit Full KYC'
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Fully verified */}
      {status === KycStatus.full && (
        <div className="bg-success/5 border border-success/20 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-success shrink-0" />
          <div>
            <p className="text-sm font-semibold text-success">KYC Complete</p>
            <p className="text-xs text-muted-foreground">You have full access to all wallet features.</p>
          </div>
        </div>
      )}
    </div>
  );
}
