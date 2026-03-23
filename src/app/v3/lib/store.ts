"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

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

export interface IncomeSource {
  id: string;
  label: string;
  amount: number;
}

export interface BudgetTemplate {
  id: string;
  name: string;
  incomes: IncomeSource[];
  budgets: Record<string, BudgetEntry>;
  createdAt: string;
}

export interface MonthlySnapshot {
  month: string; // "YYYY-MM"
  incomes: IncomeSource[];
  totalIncome: number;
  totalBudget: number;
  totalActual: number;
  budgets: Record<string, BudgetEntry>;
  notes: string;
  archivedAt: string;
}

export interface VaultNote {
  id: string;
  author: string;
  date: string; // ISO date
  text: string;
  month: string; // "YYYY-MM"
}

export interface V3Data {
  income: number; // legacy — kept for backward compat, computed from incomes
  incomes: IncomeSource[];
  budgets: Record<string, BudgetEntry>;
  transactions: Transaction[];
  month: string; // "YYYY-MM"
}

const STORAGE_KEY = "pf-v3-data";
const TEMPLATES_KEY = "pf-v3-templates";
const HISTORY_KEY = "pf-v3-history";
const VAULT_KEY = "pf-v3-vault";
const CUSTOM_RULES_KEY = "pf-v3-custom-rules";

export interface CustomRule {
  id: string;
  keyword: string;
  category: string;
  createdAt: string;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function createEmpty(): V3Data {
  const budgets: Record<string, BudgetEntry> = {};
  for (const cat of CATEGORIES) {
    budgets[cat.name] = { budget: 0, actual: 0 };
  }
  return { income: 0, incomes: [], budgets, transactions: [], month: currentMonth() };
}

function migrateData(parsed: V3Data): V3Data {
  // Migrate from single income to multi-income
  if (!parsed.incomes) {
    parsed.incomes = [];
    if (parsed.income > 0) {
      parsed.incomes.push({
        id: crypto.randomUUID(),
        label: "Main Salary",
        amount: parsed.income,
      });
    }
  }
  // Ensure all categories exist
  for (const cat of CATEGORIES) {
    if (!parsed.budgets[cat.name]) {
      parsed.budgets[cat.name] = { budget: 0, actual: 0 };
    }
  }
  // Sync legacy income field
  parsed.income = parsed.incomes.reduce((s, i) => s + i.amount, 0);
  return parsed;
}

function loadData(): V3Data {
  if (typeof window === "undefined") return createEmpty();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return migrateData(JSON.parse(raw) as V3Data);
    }
  } catch {}
  return createEmpty();
}

function loadTemplates(): BudgetTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (raw) return JSON.parse(raw) as BudgetTemplate[];
  } catch {}
  return [];
}

function loadHistory(): MonthlySnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw) as MonthlySnapshot[];
  } catch {}
  return [];
}

function loadVaultNotes(): VaultNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (raw) return JSON.parse(raw) as VaultNote[];
  } catch {}
  return [];
}

function loadCustomRules(): CustomRule[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_RULES_KEY);
    if (raw) return JSON.parse(raw) as CustomRule[];
  } catch {}
  return [];
}

/**
 * Compute budget actuals from approved transactions for a given month.
 * Only negative amounts (expenses) count. Returns positive values (abs).
 */
function computeActualsFromTransactions(
  transactions: Transaction[],
  month: string
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const cat of CATEGORIES) result[cat.name] = 0;

  for (const tx of transactions) {
    if (tx.status !== "approved") continue;
    if (!tx.date.startsWith(month)) continue;
    if (tx.amount >= 0) continue; // only expenses
    if (tx.category in result) {
      result[tx.category] += Math.abs(tx.amount);
    }
  }
  return result;
}

export function useV3Store() {
  const [data, setData] = useState<V3Data>(createEmpty);
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [history, setHistory] = useState<MonthlySnapshot[]>([]);
  const [vaultNotes, setVaultNotes] = useState<VaultNote[]>([]);
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setData(loadData());
    setTemplates(loadTemplates());
    setHistory(loadHistory());
    setVaultNotes(loadVaultNotes());
    setCustomRules(loadCustomRules());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  }, [templates, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(VAULT_KEY, JSON.stringify(vaultNotes));
  }, [vaultNotes, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(CUSTOM_RULES_KEY, JSON.stringify(customRules));
  }, [customRules, loaded]);

  // Legacy setter — kept for other pages
  const setIncome = useCallback((income: number) => {
    setData((prev) => ({ ...prev, income: Math.max(0, income) }));
  }, []);

  // Multi-income methods
  const addIncome = useCallback((label: string, amount: number) => {
    setData((prev) => {
      const newIncome: IncomeSource = { id: crypto.randomUUID(), label, amount: Math.max(0, amount) };
      const incomes = [...prev.incomes, newIncome];
      return { ...prev, incomes, income: incomes.reduce((s, i) => s + i.amount, 0) };
    });
  }, []);

  const updateIncome = useCallback((id: string, updates: Partial<Omit<IncomeSource, "id">>) => {
    setData((prev) => {
      const incomes = prev.incomes.map((i) =>
        i.id === id ? { ...i, ...updates, amount: updates.amount !== undefined ? Math.max(0, updates.amount) : i.amount } : i
      );
      return { ...prev, incomes, income: incomes.reduce((s, i) => s + i.amount, 0) };
    });
  }, []);

  const removeIncome = useCallback((id: string) => {
    setData((prev) => {
      const incomes = prev.incomes.filter((i) => i.id !== id);
      return { ...prev, incomes, income: incomes.reduce((s, i) => s + i.amount, 0) };
    });
  }, []);

  // Template methods
  const saveTemplate = useCallback((name: string) => {
    setTemplates((prev) => {
      const template: BudgetTemplate = {
        id: crypto.randomUUID(),
        name,
        incomes: data.incomes.map((i) => ({ ...i })),
        budgets: Object.fromEntries(
          Object.entries(data.budgets).map(([k, v]) => [k, { budget: v.budget, actual: 0 }])
        ),
        createdAt: new Date().toISOString(),
      };
      return [...prev, template];
    });
  }, [data.incomes, data.budgets]);

  const loadTemplate = useCallback((templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setData((prev) => {
      const budgets: Record<string, BudgetEntry> = {};
      for (const cat of CATEGORIES) {
        budgets[cat.name] = template.budgets[cat.name]
          ? { budget: template.budgets[cat.name].budget, actual: prev.budgets[cat.name]?.actual ?? 0 }
          : { budget: 0, actual: prev.budgets[cat.name]?.actual ?? 0 };
      }
      const incomes = template.incomes.map((i) => ({ ...i, id: crypto.randomUUID() }));
      return {
        ...prev,
        incomes,
        income: incomes.reduce((s, i) => s + i.amount, 0),
        budgets,
      };
    });
  }, [templates]);

  const deleteTemplate = useCallback((templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
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

  // Compute actuals from approved transactions for current month
  const computedActuals = useMemo(
    () => computeActualsFromTransactions(data.transactions, data.month),
    [data.transactions, data.month]
  );

  // Effective budgets: merge targets with computed actuals (manual actual as fallback)
  const effectiveBudgets = useMemo(() => {
    const result: Record<string, BudgetEntry> = {};
    for (const cat of CATEGORIES) {
      const entry = data.budgets[cat.name] ?? { budget: 0, actual: 0 };
      const computed = computedActuals[cat.name] ?? 0;
      // Use computed if there are transactions, otherwise fall back to manual actual
      result[cat.name] = {
        budget: entry.budget,
        actual: computed > 0 ? computed : entry.actual,
      };
    }
    return result;
  }, [data.budgets, computedActuals]);

  // Archive current month before resetting — uses effective actuals
  const archiveAndReset = useCallback(() => {
    const totalIncome = data.incomes.reduce((s, i) => s + i.amount, 0);
    const totalBudget = Object.values(effectiveBudgets).reduce((s, b) => s + b.budget, 0);
    const totalActual = Object.values(effectiveBudgets).reduce((s, b) => s + b.actual, 0);

    setHistory((prev) => {
      if (totalIncome === 0 && totalBudget === 0 && totalActual === 0) return prev;
      const snapshotBudgets = Object.fromEntries(
        Object.entries(effectiveBudgets).map(([k, v]) => [k, { budget: v.budget, actual: v.actual }])
      );
      const notes = localStorage.getItem("pf-v3-notes") ?? "";
      const existing = prev.find((s) => s.month === data.month);
      if (existing) {
        return prev.map((s) => s.month === data.month
          ? { ...s, totalIncome, totalBudget, totalActual, budgets: snapshotBudgets, incomes: data.incomes.map((i) => ({ ...i })), archivedAt: new Date().toISOString(), notes }
          : s
        );
      }
      const snapshot: MonthlySnapshot = {
        month: data.month,
        incomes: data.incomes.map((i) => ({ ...i })),
        totalIncome,
        totalBudget,
        totalActual,
        budgets: snapshotBudgets,
        notes,
        archivedAt: new Date().toISOString(),
      };
      return [...prev, snapshot].sort((a, b) => b.month.localeCompare(a.month));
    });
    setData(createEmpty());
    localStorage.setItem("pf-v3-notes", "");
  }, [data, effectiveBudgets]);

  const resetAll = useCallback(() => {
    setData(createEmpty());
  }, []);

  const setMonth = useCallback((month: string) => {
    setData((prev) => ({ ...prev, month }));
  }, []);

  // Vault note methods
  const addVaultNote = useCallback((author: string, text: string) => {
    setVaultNotes((prev) => {
      const note: VaultNote = {
        id: crypto.randomUUID(),
        author,
        date: new Date().toISOString(),
        text,
        month: data.month,
      };
      return [note, ...prev];
    });
  }, [data.month]);

  const deleteVaultNote = useCallback((id: string) => {
    setVaultNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Custom categorization rules (learned from user corrections)
  const addCustomRule = useCallback((keyword: string, category: string) => {
    setCustomRules((prev) => {
      // Don't duplicate
      const existing = prev.find((r) => r.keyword.toLowerCase() === keyword.toLowerCase());
      if (existing) {
        return prev.map((r) => r.id === existing.id ? { ...r, category, createdAt: new Date().toISOString() } : r);
      }
      return [...prev, { id: crypto.randomUUID(), keyword: keyword.toLowerCase(), category, createdAt: new Date().toISOString() }];
    });
  }, []);

  const deleteCustomRule = useCallback((id: string) => {
    setCustomRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const totals = useMemo(() => {
    const totalBudget = Object.values(effectiveBudgets).reduce((s, b) => s + b.budget, 0);
    const totalActual = Object.values(effectiveBudgets).reduce((s, b) => s + b.actual, 0);
    return {
      totalBudget,
      totalActual,
      remaining: data.income - totalActual,
      budgetRemaining: totalBudget - totalActual,
      pct: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0,
    };
  }, [effectiveBudgets, data.income]);

  return {
    data,
    loaded,
    totals,
    effectiveBudgets,
    computedActuals,
    templates,
    history,
    vaultNotes,
    customRules,
    setIncome,
    addIncome,
    updateIncome,
    removeIncome,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
    setBudget,
    setActual,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    resetAll,
    setMonth,
    archiveAndReset,
    addVaultNote,
    deleteVaultNote,
    addCustomRule,
    deleteCustomRule,
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

/* ── Pure helper functions for review cards + dashboard ──── */

export interface DuplicateGroup {
  key: string;
  transactions: Transaction[];
}

export interface Trends {
  incomeChange: number;
  expenseChange: number;
  savingsRateChange: number;
}

export interface RecurringItem {
  description: string;
  amount: number;
  category: CategoryName;
  monthsActive: number;
}

export interface TopMerchant {
  description: string;
  total: number;
  count: number;
  category: CategoryName;
}

export interface DailySpending {
  date: string;
  amount: number;
  cumulative: number;
}

export interface UnusualSpending {
  category: string;
  icon: string;
  currentAmount: number;
  averageAmount: number;
  spikePct: number;
}

function wordSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 1));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 1));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  return intersection / Math.max(wordsA.size, wordsB.size);
}

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24);
}

/** Find possible duplicate transactions (same amount, similar description, close dates) */
export function findPossibleDuplicates(transactions: Transaction[]): DuplicateGroup[] {
  const pending = transactions.filter((t) => t.status === "pending");
  const amountGroups = new Map<string, Transaction[]>();

  for (const tx of pending) {
    const key = Math.abs(tx.amount).toFixed(2);
    const group = amountGroups.get(key) ?? [];
    group.push(tx);
    amountGroups.set(key, group);
  }

  const result: DuplicateGroup[] = [];
  for (const [amtKey, txs] of amountGroups) {
    if (txs.length < 2) continue;
    // Find pairs with similar descriptions and close dates
    const used = new Set<string>();
    for (let i = 0; i < txs.length; i++) {
      if (used.has(txs[i].id)) continue;
      const group: Transaction[] = [txs[i]];
      for (let j = i + 1; j < txs.length; j++) {
        if (used.has(txs[j].id)) continue;
        if (
          wordSimilarity(txs[i].description, txs[j].description) > 0.5 &&
          daysBetween(txs[i].date, txs[j].date) <= 1
        ) {
          group.push(txs[j]);
          used.add(txs[j].id);
        }
      }
      if (group.length >= 2) {
        used.add(txs[i].id);
        result.push({ key: `dup-${amtKey}-${i}`, transactions: group });
      }
    }
  }
  return result;
}

/** Compute trend percentages vs previous month */
export function computeTrends(
  currentIncome: number,
  currentExpenses: number,
  history: MonthlySnapshot[]
): Trends {
  if (history.length === 0) return { incomeChange: 0, expenseChange: 0, savingsRateChange: 0 };
  const prev = history[0]; // newest archived month
  const incomeChange = prev.totalIncome > 0 ? ((currentIncome - prev.totalIncome) / prev.totalIncome) * 100 : 0;
  const expenseChange = prev.totalActual > 0 ? ((currentExpenses - prev.totalActual) / prev.totalActual) * 100 : 0;
  const currentRate = currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0;
  const prevRate = prev.totalIncome > 0 ? ((prev.totalIncome - prev.totalActual) / prev.totalIncome) * 100 : 0;
  return { incomeChange, expenseChange, savingsRateChange: currentRate - prevRate };
}

/** Detect recurring transactions (same merchant appearing in multiple months) */
export function detectRecurring(
  transactions: Transaction[],
  history: MonthlySnapshot[]
): RecurringItem[] {
  // Get unique descriptions from current month
  const currentDescs = new Map<string, { amount: number; category: CategoryName }>();
  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    const key = tx.description.toLowerCase().trim();
    if (!currentDescs.has(key)) {
      currentDescs.set(key, { amount: Math.abs(tx.amount), category: tx.category });
    }
  }

  // Check how many historical months each description appears in
  const result: RecurringItem[] = [];
  for (const [desc, info] of currentDescs) {
    let monthsFound = 1; // current month
    for (const snap of history) {
      // Check if any category in this snapshot has transactions matching the description
      // Since snapshots don't store individual transactions, check if budget actual > 0
      // This is approximate — for better detection, we'd need to store transaction descriptions in snapshots
      // For now, just check the subscriptions/insurance categories as likely recurring
      if (info.category === "Subscriptions" || info.category === "Insurance" || info.category === "Rent & Utilities") {
        const snapEntry = snap.budgets[info.category];
        if (snapEntry && snapEntry.actual > 0) monthsFound++;
      }
    }
    if (monthsFound >= 2 || info.category === "Subscriptions") {
      result.push({ description: desc, amount: info.amount, category: info.category, monthsActive: monthsFound });
    }
  }

  return result.sort((a, b) => b.amount - a.amount).slice(0, 10);
}

/** Get top merchants by total spend */
export function getTopMerchants(
  transactions: Transaction[],
  month: string,
  limit: number = 5
): TopMerchant[] {
  const groups = new Map<string, { total: number; count: number; category: CategoryName }>();

  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    if (!tx.date.startsWith(month)) continue;
    const key = tx.description.toLowerCase().trim();
    const existing = groups.get(key);
    if (existing) {
      existing.total += Math.abs(tx.amount);
      existing.count++;
    } else {
      groups.set(key, { total: Math.abs(tx.amount), count: 1, category: tx.category });
    }
  }

  return [...groups.entries()]
    .map(([desc, data]) => ({ description: desc, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/** Get daily spending with cumulative totals */
export function getDailySpending(
  transactions: Transaction[],
  month: string
): DailySpending[] {
  const daily = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.status !== "approved") continue;
    if (tx.amount >= 0) continue;
    if (!tx.date.startsWith(month)) continue;
    daily.set(tx.date, (daily.get(tx.date) ?? 0) + Math.abs(tx.amount));
  }

  const sorted = [...daily.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  let cumulative = 0;
  return sorted.map(([date, amount]) => {
    cumulative += amount;
    return { date, amount, cumulative };
  });
}

/** Find the biggest spending spike vs 6-month average */
export function findUnusualSpending(
  effectiveBudgets: Record<string, BudgetEntry>,
  history: MonthlySnapshot[]
): UnusualSpending | null {
  if (history.length < 1) return null;

  let biggest: UnusualSpending | null = null;

  for (const cat of CATEGORIES) {
    const current = effectiveBudgets[cat.name]?.actual ?? 0;
    if (current === 0) continue;

    // Compute average from history
    const historicalAmounts = history
      .map((s) => s.budgets[cat.name]?.actual ?? 0)
      .filter((a) => a > 0);
    if (historicalAmounts.length === 0) continue;

    const avg = historicalAmounts.reduce((s, a) => s + a, 0) / historicalAmounts.length;
    if (avg === 0) continue;

    const spikePct = ((current - avg) / avg) * 100;
    if (spikePct > 10 && (!biggest || spikePct > biggest.spikePct)) {
      biggest = { category: cat.name, icon: cat.icon, currentAmount: current, averageAmount: avg, spikePct };
    }
  }

  return biggest;
}
