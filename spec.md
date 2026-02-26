# Specification

## Summary
**Goal:** Add QR code-based payment features to the Wallet screen and redesign it to feel like a modern peer-to-peer payment app (no bank account needed).

**Planned changes:**
- Redesign the Wallet screen with a gradient balance card at the top and a horizontal row of three action buttons: Receive, Scan & Pay, and Transfer to Locker
- Add a "Receive Money" section that displays a QR code generated from the user's wallet identifier (principal ID), with a "Scan to Pay Me" label and a "Copy ID" button
- Add a "Scan & Pay" full-screen camera overlay that scans another user's payment QR code and pre-fills a Send Money form with the recipient identifier
- Add a Send Money form (recipient, amount, optional note) with confirmation flow that deducts from the sender's wallet balance and records an outgoing transaction
- Add a new backend function `sendFundsFromWallet` that validates balance, deducts the amount, and records the outgoing transaction with type "sent", recipient label, timestamp, and note
- Show color-coded transaction history: green for received, red/orange for sent, teal for locker transfers
- Show error toast if wallet balance is insufficient; show success/error toasts for all send actions
- New transaction appears immediately in the wallet transaction history after sending

**User-visible outcome:** Users can display their QR code to receive money and scan others' QR codes to send money directly within the app's internal wallet, with a polished payment-app-style UI on mobile.
