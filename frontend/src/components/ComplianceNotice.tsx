import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function ComplianceNotice() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-muted/40 border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Info size={15} className="text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground">Legal & Compliance Notice</span>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 text-xs text-muted-foreground border-t border-border pt-3">
          <div>
            <p className="font-semibold text-foreground mb-1">📱 Simulated Wallet</p>
            <p>
              This is a simulated in-app wallet for educational and demonstration purposes only.
              No real money is transferred or stored.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">🏦 RBI / PPI Licensing (India)</p>
            <p>
              Real digital wallets and Prepaid Payment Instruments (PPIs) in India require a valid
              licence from the Reserve Bank of India (RBI) under the Payment and Settlement Systems
              Act, 2007. This app does not hold such a licence.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">🔒 Aadhaar & KYC Data</p>
            <p>
              Any KYC information you provide (including Aadhaar last 4 digits) is stored only
              within this app's on-chain canister and is never shared with third parties or
              government databases.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">🔞 Age Requirement</p>
            <p>
              Full KYC requires the user to be 18 years or older. Minors must have guardian
              consent before submitting any identity information.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
