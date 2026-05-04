export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  note: string;
  date: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  month: string; // YYYY-MM format
}

export interface AppState {
  user: User | null;
  transactions: Transaction[];
  budgets: Budget[];
}

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Gift",
  "Other Income"
];

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Rent",
  "Other Expense"
];
