# Specification

## Summary
**Goal:** Build a full-stack Student Budget Manager web app that helps students track income, allocate budgets, log expenses, manage savings goals with a digital locker, and view low-risk investment suggestions.

**Planned changes:**
- Backend actor storing per-user financial profiles: income sources (pocket money, stipend, part-time), allocation splits (spending/saving/investment), expense log, savings goals, and Digital Locker state
- Backend functions: `addIncome`, `getProfile`, `setAllocationSplit`, `addExpense`, `getExpenses`, `addSavingsGoal`, `updateSavingsGoal`, `getSavingsGoals`, `getLockerStatus`, `requestUnlock`, `getInvestmentSuggestions`, `getDailySpendLimit`
- Onboarding/Income Setup screen with income fields for each source, live allocation preview, and adjustable sliders (Spending/Saving/Investment) that enforce 100% total
- Dashboard screen showing three balance cards (Spending, Saving, Investment), daily spend limit, locked savings indicator, last 5 expenses, and quick-action buttons
- Expense Tracker screen with add-expense form (amount, category, note), date-grouped history, and a spending progress bar with color thresholds
- Savings Goal Tracker screen with create-goal form (name, target, deadline, locker toggle), goal cards with progress bars, Top Up button, and Unlock Goal action
- Investment Suggestions screen with at least 3 curated low-risk option cards (name, description, minimum amount, return range, risk badge) and a 1/3/5-year projection based on the user's monthly investment amount
- Budget Calculator screen (stateless tool) with hypothetical income input, split sliders, real-time outputs for spending/saving/investment amounts, daily spend limit, and sample category breakdown
- Mobile-first UI (max-width 430px) with green/teal primary palette, amber/red warnings, card-based layout, and a bottom navigation bar with 5 tabs: Dashboard, Expenses, Goals, Invest, Calculator

**User-visible outcome:** Students can set up their monthly income, automatically split it into spending/saving/investment buckets, log daily expenses, track and lock savings goals, explore low-risk investment ideas, and use a standalone budget calculator — all from a mobile-friendly interface.
