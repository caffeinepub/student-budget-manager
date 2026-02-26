# Specification

## Summary
**Goal:** Remove the "Add Funds" / "Receive Money" form feature from the Wallet screen and its corresponding backend function.

**Planned changes:**
- Remove the collapsible "Add Funds" / "Receive Money" form, its trigger button, and related state variables from the Wallet component (`frontend/src/components/Wallet.tsx`)
- Remove the `addFundsToWallet` mutation call from the Wallet component
- Remove or stub out the `addFundsToWallet` public function in the backend (`backend/main.mo`)

**User-visible outcome:** The Wallet screen no longer shows any "Add Funds" form or button. All other wallet features — balance display, Transfer to Locker, QR code Receive modal, Scan & Pay, and transaction history — remain intact and functional.
