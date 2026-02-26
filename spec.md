# Specification

## Summary
**Goal:** Remove the Gmail/Google login option from the login page, leaving Internet Identity as the sole authentication method.

**Planned changes:**
- Remove the Gmail/Google login button and any related UI elements from `LoginPage.tsx`
- Delete all Google OAuth imports, SDK scripts, state variables, and handler functions from the frontend

**User-visible outcome:** The login page shows only the Internet Identity login button, with no Google/Gmail login option present.
