"use client";

import { useState, useEffect, useCallback } from "react";

export const CATEGORIES = [
  { name: "Rent & Utilities", icon: "home", group: "Fixed Monthly" },
  { name: "Groceries", icon: "shopping_basket", group: "Variable Monthly" },
  { name: "Eating Out", icon: "restaurant", group: "Entertainment" },
  { name: "Transport", icon: "directions_car", group: "Fuel & Transit" },
  { name: "Subscriptions", icon: "subscriptions", group: "Services" },
  { name: "Health", icon: "favorite", group: "Wellness" },
  { name: "Shopping", icon: "shopping_cart", group: "Retail" },
  { name: "Insurance", icon: "shield", group: "Protection" },
  { name: "Savings", icon: "savings", group: "Investments" },
  { name: "Other", icon: "more_horiz", group: "Miscellaneous" },
] as const;

export type CategoryName = (typeof CATEGORIES)[number]["name"];

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: CategoryName;
  date: string;
  status: "pending" | "approved";
}

export interface BudgetEntry {
  budget: number;
  actual: number;
}

export interface V3Data {
  income: number;
  budgets: Record<string, BudgetEntry>;
  transactions: Transaction[];
  month: string; // "YYYY-MM"
}

const STORAGE_KEY = "pf-v3-data";

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function createEmpty(): V3Data {
  const budgets: Record<string, BudgetEntry> = {};
  for (const cat of CATEGORIES) {
    budgets[cat.name] = { budget: 0, actual: 0 };
  }
  return { income: 0, budgets, transactions: [], month: currentMonth() };
}

function loadData(): V3Data {
  if (typeof window === "undefined") return createEmpty();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as V3Data;
      // Ensure all categories exist
      for (const cat of CATEGORIES) {
        if (!parsed.budgets[cat.name]) {
          parsed.budgets[cat.name] = { budget: 0, actual: 0 };
        }
      }
      return parsed;
    }
  } catch {}
  return createEmpty();
}

export function useV3Store() {
  const [data, setData] = useState<V3Data>(createEmpty);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setData(loadData());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, loaded]);

  const setIncome = useCallback((income: number) => {
    setData((prev) => ({ ...prev, income: Math.max(0, income) }));
  }, []);

  const setBudget = useCallback((category: string, budget: number) => {
    setData((prev) => ({
      ...prev,
      budgets: {
        ...prev.budgets,
        [category]: { ...prev.budgets[category], budget: Math.max(0, budget) },
      },
    }));
  }, []);

  const setActual = useCallback((category: string, actual: number) => {
    setData((prev) => ({
      ...prev,
      budgets: {
        ...prev.budgets,
        [category]: { ...prev.budgets[category], actual: Math.max(0, actual) },
      },
    }));
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    setData((prev) => ({
      ...prev,
      transactions: [
        { ...tx, id: crypto.randomUUID() },
        ...prev.transactions,
      ],
    }));
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  }, []);

  const resetAll = useCallback(() => {
    setData(createEmpty());
  }, []);

  const totals = {
    totalBudget: Object.values(data.budgets).reduce((s, b) => s + b.budget, 0),
    totalActual: Object.values(data.budgets).reduce((s, b) => s + b.actual, 0),
    get remaining() { return data.income - this.totalActual; },
    get budgetRemaining() { return this.totalBudget - this.totalActual; },
    get pct() { return this.totalBudget > 0 ? (this.totalActual / this.totalBudget) * 100 : 0; },
  };

  return {
    data,
    loaded,
    totals,
    setIncome,
    setBudget,
    setActual,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    resetAll,
  };
}

export function formatNOK(amount: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
