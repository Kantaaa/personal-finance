"use client";

/**
 * Seed dummy data into localStorage for testing/demo purposes.
 * Call seedDemoData() then reload the page.
 */

import type { V3Data, MonthlySnapshot, BudgetTemplate, VaultNote, IncomeSource, BudgetEntry, Transaction } from "./store";
import { CATEGORIES } from "./store";

function month(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function uuid(): string {
  return crypto.randomUUID();
}

// Realistic Norwegian household budget amounts (NOK)
const BUDGET_PROFILES: Record<string, { budget: number; variance: () => number }> = {
  "Rent & Utilities":  { budget: 12000, variance: () => Math.round((Math.random() * 2000) - 500) },
  "Groceries":         { budget: 6000,  variance: () => Math.round((Math.random() * 2000) - 800) },
  "Eating Out":        { budget: 3000,  variance: () => Math.round((Math.random() * 2500) - 500) },
  "Transport":         { budget: 2000,  variance: () => Math.round((Math.random() * 1200) - 400) },
  "Subscriptions":     { budget: 1500,  variance: () => Math.round((Math.random() * 400) - 100) },
  "Health":            { budget: 1000,  variance: () => Math.round((Math.random() * 800) - 200) },
  "Shopping":          { budget: 2500,  variance: () => Math.round((Math.random() * 3000) - 1000) },
  "Insurance":         { budget: 2200,  variance: () => Math.round((Math.random() * 300) - 100) },
  "Savings":           { budget: 5000,  variance: () => Math.round((Math.random() * 2000) - 500) },
  "Other":             { budget: 1500,  variance: () => Math.round((Math.random() * 1500) - 500) },
};

function makeBudgets(seasonMultiplier?: Record<string, number>): Record<string, BudgetEntry> {
  const budgets: Record<string, BudgetEntry> = {};
  for (const cat of CATEGORIES) {
    const profile = BUDGET_PROFILES[cat.name];
    const multiplier = seasonMultiplier?.[cat.name] ?? 1;
    const budget = Math.round(profile.budget * multiplier);
    const actual = Math.max(0, budget + profile.variance());
    budgets[cat.name] = { budget, actual };
  }
  return budgets;
}

const INCOMES: IncomeSource[] = [
  { id: uuid(), label: "Partner 1 (Salary)", amount: 35000 },
  { id: uuid(), label: "Partner 2 (Salary)", amount: 28000 },
  { id: uuid(), label: "Freelance Side Work", amount: 5000 },
];

function makeTransactions(m: string): Transaction[] {
  const txns: { desc: string; amount: number; cat: string }[] = [
    { desc: "Rema 1000 Grønland", amount: -450, cat: "Groceries" },
    { desc: "Kiwi Torshov", amount: -380, cat: "Groceries" },
    { desc: "Meny Majorstuen", amount: -720, cat: "Groceries" },
    { desc: "Peppes Pizza", amount: -590, cat: "Eating Out" },
    { desc: "Cafe Sara", amount: -185, cat: "Eating Out" },
    { desc: "Ruter Månedskort", amount: -850, cat: "Transport" },
    { desc: "Circle K Diesel", amount: -680, cat: "Transport" },
    { desc: "Netflix", amount: -169, cat: "Subscriptions" },
    { desc: "Spotify Family", amount: -179, cat: "Subscriptions" },
    { desc: "Apotek 1 Vitamins", amount: -290, cat: "Health" },
    { desc: "H&M Online", amount: -1200, cat: "Shopping" },
    { desc: "IKEA Furnes", amount: -890, cat: "Shopping" },
    { desc: "If Forsikring", amount: -2200, cat: "Insurance" },
    { desc: "Husleie Mars", amount: -11500, cat: "Rent & Utilities" },
    { desc: "Fjordkraft Strøm", amount: -850, cat: "Rent & Utilities" },
    { desc: "Overføring Sparekonto", amount: -5000, cat: "Savings" },
  ];

  return txns.map((t, i) => ({
    id: uuid(),
    description: t.desc,
    amount: t.amount,
    category: t.cat as Transaction["category"],
    date: `${m}-${String(Math.min(i + 3, 28)).padStart(2, "0")}`,
    status: (i < 12 ? "approved" : "pending") as Transaction["status"],
  }));
}

export function seedDemoData(): void {
  const now = month(0);

  // ── Current month data ──
  const currentBudgets = makeBudgets();
  const currentData: V3Data = {
    income: INCOMES.reduce((s, i) => s + i.amount, 0),
    incomes: INCOMES.map((i) => ({ ...i, id: uuid() })),
    budgets: currentBudgets,
    transactions: makeTransactions(now),
    month: now,
  };
  localStorage.setItem("pf-v3-data", JSON.stringify(currentData));

  // ── History (5 past months) ──
  const historyData: MonthlySnapshot[] = [];
  for (let i = 1; i <= 5; i++) {
    const m = month(i);
    // Slight seasonal variation
    const seasonal: Record<string, number> | undefined =
      i >= 3 ? { "Shopping": 1.4, "Eating Out": 1.3, "Savings": 0.8 } : undefined;
    const budgets = makeBudgets(seasonal);
    const totalIncome = 68000 + Math.round((Math.random() - 0.5) * 4000);
    const totalBudget = Object.values(budgets).reduce((s, b) => s + b.budget, 0);
    const totalActual = Object.values(budgets).reduce((s, b) => s + b.actual, 0);

    historyData.push({
      month: m,
      incomes: [
        { id: uuid(), label: "Partner 1 (Salary)", amount: 35000 },
        { id: uuid(), label: "Partner 2 (Salary)", amount: 28000 + Math.round((Math.random() - 0.5) * 4000) },
        { id: uuid(), label: "Freelance Side Work", amount: 5000 + Math.round((Math.random() - 0.5) * 3000) },
      ],
      totalIncome,
      totalBudget,
      totalActual,
      budgets,
      notes: [
        "Good month overall. Managed to stay under budget on groceries.",
        "Dining out was higher than expected — two birthday dinners.",
        "Saved extra this month by skipping the electronics purchase.",
        "Winter utility bills pushed us slightly over. Adjust next month.",
        "Solid progress on the down payment fund. Keep it up!",
      ][i - 1],
      archivedAt: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  localStorage.setItem("pf-v3-history", JSON.stringify(historyData));

  // ── Templates ──
  const templates: BudgetTemplate[] = [
    {
      id: uuid(),
      name: "Normal Month",
      incomes: INCOMES.map((i) => ({ ...i, id: uuid() })),
      budgets: Object.fromEntries(
        CATEGORIES.map((c) => [c.name, { budget: BUDGET_PROFILES[c.name].budget, actual: 0 }])
      ),
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: uuid(),
      name: "Christmas Budget",
      incomes: [
        { id: uuid(), label: "Partner 1 (Salary)", amount: 35000 },
        { id: uuid(), label: "Partner 2 (Salary)", amount: 28000 },
        { id: uuid(), label: "Christmas Bonus", amount: 8000 },
      ],
      budgets: Object.fromEntries(
        CATEGORIES.map((c) => {
          const base = BUDGET_PROFILES[c.name].budget;
          const mult = c.name === "Shopping" ? 2.5 : c.name === "Eating Out" ? 1.8 : c.name === "Savings" ? 0.5 : 1;
          return [c.name, { budget: Math.round(base * mult), actual: 0 }];
        })
      ),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: uuid(),
      name: "Summer Vacation",
      incomes: INCOMES.map((i) => ({ ...i, id: uuid() })),
      budgets: Object.fromEntries(
        CATEGORIES.map((c) => {
          const base = BUDGET_PROFILES[c.name].budget;
          const mult = c.name === "Eating Out" ? 2 : c.name === "Transport" ? 2.5 : c.name === "Savings" ? 0.3 : c.name === "Groceries" ? 0.6 : 1;
          return [c.name, { budget: Math.round(base * mult), actual: 0 }];
        })
      ),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
  localStorage.setItem("pf-v3-templates", JSON.stringify(templates));

  // ── Vault Notes ──
  const vaultNotes: VaultNote[] = [
    {
      id: uuid(),
      author: "Marcus",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      text: "The dining spending was high due to the anniversary, but we offset it by skipping the new electronics. Great progress on the down payment fund!",
      month: now,
    },
    {
      id: uuid(),
      author: "Sarah",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      text: "Our savings rate finally hit 40%! Let's discuss moving some of the surplus to the tax-advantaged account next month.",
      month: now,
    },
    {
      id: uuid(),
      author: "Marcus",
      date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      text: "Freelance income was lower this month. Let's keep shopping in check to compensate.",
      month: month(1),
    },
    {
      id: uuid(),
      author: "Sarah",
      date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      text: "Winter electricity bill was brutal. Should we switch provider or lock in a fixed rate?",
      month: month(2),
    },
  ];
  localStorage.setItem("pf-v3-vault", JSON.stringify(vaultNotes));

  // ── Review notes ──
  localStorage.setItem("pf-v3-notes", "Consider moving kr 1 000 from Eating Out to Savings next month. Also look into cheaper insurance options — If quoted us kr 1 800.");
}

export function clearDemoData(): void {
  localStorage.removeItem("pf-v3-data");
  localStorage.removeItem("pf-v3-history");
  localStorage.removeItem("pf-v3-templates");
  localStorage.removeItem("pf-v3-vault");
  localStorage.removeItem("pf-v3-notes");
  localStorage.removeItem("pf-v3-dark");
}
