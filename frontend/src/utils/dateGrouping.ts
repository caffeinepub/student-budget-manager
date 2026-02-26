import type { Expense } from '../backend';

export interface ExpenseGroup {
  label: string;
  expenses: Expense[];
}

export function groupExpensesByDate(expenses: Expense[]): ExpenseGroup[] {
  const groups: Map<string, Expense[]> = new Map();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Sort expenses by date descending
  const sorted = [...expenses].sort((a, b) => {
    const aMs = Number(a.date) / 1_000_000;
    const bMs = Number(b.date) / 1_000_000;
    return bMs - aMs;
  });

  for (const expense of sorted) {
    const dateMs = Number(expense.date) / 1_000_000;
    const expenseDate = new Date(dateMs);
    expenseDate.setHours(0, 0, 0, 0);

    let label: string;
    if (expenseDate.getTime() === today.getTime()) {
      label = 'Today';
    } else if (expenseDate.getTime() === yesterday.getTime()) {
      label = 'Yesterday';
    } else {
      label = expenseDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: expenseDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(expense);
  }

  return Array.from(groups.entries()).map(([label, expenses]) => ({ label, expenses }));
}
