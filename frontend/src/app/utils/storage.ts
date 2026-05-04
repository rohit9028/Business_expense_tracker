import { User, Transaction, Budget } from "../types";

const USERS_KEY = "expense_tracker_users";
const TRANSACTIONS_KEY = "expense_tracker_transactions";
const BUDGETS_KEY = "expense_tracker_budgets";
const CURRENT_USER_KEY = "expense_tracker_current_user";

// User Storage
export const saveUser = (user: User, password: string): void => {
  const users = getUsers();
  users.push({ ...user, password });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getUsers = (): Array<User & { password: string }> => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const authenticateUser = (
  email: string,
  password: string
): User | null => {
  const users = getUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

// Transaction Storage
export const saveTransaction = (transaction: Transaction): void => {
  const transactions = getTransactions();
  transactions.push(transaction);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

export const getTransactions = (userId?: string): Transaction[] => {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  const allTransactions: Transaction[] = data ? JSON.parse(data) : [];
  return userId
    ? allTransactions.filter((t) => t.userId === userId)
    : allTransactions;
};

export const updateTransaction = (
  id: string,
  updates: Partial<Transaction>
): void => {
  const transactions = getTransactions();
  const index = transactions.findIndex((t) => t.id === id);
  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...updates };
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  }
};

export const deleteTransaction = (id: string): void => {
  const transactions = getTransactions();
  const filtered = transactions.filter((t) => t.id !== id);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filtered));
};

// Budget Storage
export const saveBudget = (budget: Budget): void => {
  const budgets = getBudgets();
  budgets.push(budget);
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
};

export const getBudgets = (userId?: string): Budget[] => {
  const data = localStorage.getItem(BUDGETS_KEY);
  const allBudgets: Budget[] = data ? JSON.parse(data) : [];
  return userId ? allBudgets.filter((b) => b.userId === userId) : allBudgets;
};

export const updateBudget = (id: string, updates: Partial<Budget>): void => {
  const budgets = getBudgets();
  const index = budgets.findIndex((b) => b.id === id);
  if (index !== -1) {
    budgets[index] = { ...budgets[index], ...updates };
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
  }
};

export const deleteBudget = (id: string): void => {
  const budgets = getBudgets();
  const filtered = budgets.filter((b) => b.id !== id);
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(filtered));
};
