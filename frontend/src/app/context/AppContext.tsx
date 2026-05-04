import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { User, Transaction, Budget } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

interface AppContextType {
  user: User | null;
  transactions: Transaction[];
  budgets: Budget[];
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  addTransaction: (transaction: Omit<Transaction, "id" | "userId">) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, "id" | "userId">) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  // Authenticated fetch helper
  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  };

  // Load transactions + budgets when user is logged in
  useEffect(() => {
    if (!token) return;
    apiFetch("/transactions?limit=100").then((d) => setTransactions(d.data || [])).catch(() => {});
    apiFetch("/budgets").then((d) => setBudgets(d.data || [])).catch(() => {});
  }, [token]);

  // Socket.IO real-time connection (using native WebSocket via socket.io protocol)
  useEffect(() => {
    if (!token) return;

    // Dynamically import socket.io-client if available, else skip
    let cleanup = () => {};
    try {
      import("socket.io-client").then(({ io }) => {
        const socket = io(SOCKET_URL);
        socket.on("expenseAdded", (t: Transaction) =>
          setTransactions((prev) => [t, ...prev])
        );
        socket.on("expenseUpdated", (t: Transaction) =>
          setTransactions((prev) => prev.map((x) => (x.id === t.id ? t : x)))
        );
        socket.on("expenseDeleted", ({ id }: { id: string }) =>
          setTransactions((prev) => prev.filter((x) => x.id !== id))
        );
        cleanup = () => socket.disconnect();
      }).catch(() => {});
    } catch {}
    return () => cleanup();
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("token", data.token);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("token", data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setTransactions([]);
    setBudgets([]);
    localStorage.removeItem("token");
  };

  const addTransaction = async (transaction: Omit<Transaction, "id" | "userId">) => {
    await apiFetch("/transactions", {
      method: "POST",
      body: JSON.stringify(transaction),
    });
    // Real-time socket will handle UI update via "expenseAdded" event
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    await apiFetch(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  };

  const deleteTransaction = async (id: string) => {
    await apiFetch(`/transactions/${id}`, { method: "DELETE" });
  };

  const addBudget = async (budget: Omit<Budget, "id" | "userId">) => {
    const data = await apiFetch("/budgets", {
      method: "POST",
      body: JSON.stringify(budget),
    });
    setBudgets((prev) => [...prev, data.data]);
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    const data = await apiFetch(`/budgets/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    setBudgets((prev) => prev.map((b) => (b.id === id ? data.data : b)));
  };

  const deleteBudget = async (id: string) => {
    await apiFetch(`/budgets/${id}`, { method: "DELETE" });
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        user, token, transactions, budgets, loading,
        login, register, logout,
        addTransaction, updateTransaction, deleteTransaction,
        addBudget, updateBudget, deleteBudget,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
