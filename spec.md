# Specification

## Summary
**Goal:** Add a fully simulated wallet system to the Student Budget Manager app, including wallet balance management, PIN security, KYC flows, transaction history, and an admin panel.

**Planned changes:**
- Extend the backend Motoko actor with per-user wallet data: balance, hashed PIN, KYC status/details, and transaction log stored in stable storage
- Add backend update functions: `createWallet`, `addFundsToWallet`, `deductFromWallet`, `transferToLockerFromWallet`, `setWalletPIN`, `verifyWalletPIN`, `submitBasicKYC`, `submitFullKYC`
- Add backend query functions: `getWalletBalance`, `getWalletTransactions`, `getKYCStatus`, `getWalletProfile`
- Add backend `getAllWalletSummaries` query restricted to a hardcoded admin principal
- Add React Query hooks for all new wallet backend functions in `useQueries.ts`
- Create a `Wallet.tsx` screen with a gradient balance card, quick-action buttons (Add Money, Pay/Send, Transfer to Locker, KYC), collapsible form sections for each action, and a date-grouped transaction history with colour-coded type badges
- Create a KYC flow (modal/sub-page) inside the Wallet screen with status badge, Basic KYC form (name, DOB, phone, Aadhaar last 4), and Full KYC form (address, photo ID reference)
- Create a PIN setup and verification flow with a mobile-style PIN-pad UI gating wallet access
- Add a collapsible legal/compliance notice card on the Wallet screen and KYC screens covering PPI licensing, Aadhaar data handling, and age requirements
- Add a Wallet tab (sixth item) to the bottom navigation bar and register the `/wallet` route in `App.tsx`
- Update `Dashboard.tsx` to show a Wallet balance card and a "Go to Wallet" quick-action button
- Create an `AdminPanel.tsx` screen at hidden route `/admin` showing a user table (principal, balance, KYC status), transaction counts, and system stats summary cards

**User-visible outcome:** Students can create an in-app wallet, top it up, make simulated payments, transfer funds to their savings locker, complete tiered KYC, and review transaction history — all secured behind a 4-digit PIN — while an admin can view aggregated wallet data via a hidden panel.
