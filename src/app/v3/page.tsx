"use client";

import { useState } from "react";
import Link from "next/link";
import { useV3Store, formatNOK, CATEGORIES } from "@/app/v3/lib/store";

// Color assignments for donut chart segments
const CATEGORY_COLORS = [
  "#005050", "#006a6a", "#005315", "#2a7a5b", "#3e8e7e",
  "#4a9e8e", "#5bae9e", "#6cc0ae", "#7dd2be", "#8ee4ce",
];

export default function V3DashboardPage() {
  const { data, loaded, totals, setIncome } = useV3Store();
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState("");

  if (!loaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--v3-primary)] border-t-transparent" />
      </div>
    );
  }

  const balance = data.income - totals.totalActual;
  const recentTransactions = data.transactions.slice(0, 5);

  // Welcome state: no income set
  if (data.income === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="premium-gradient rounded-xl p-10 text-white text-center space-y-6">
          <span className="material-symbols-outlined text-5xl opacity-80">waving_hand</span>
          <h1 className="font-[Manrope] text-3xl font-extrabold">Welcome to Your Budget Planner</h1>
          <p className="text-white/80 font-[Inter] max-w-md mx-auto">
            Get started by setting your monthly income and configuring your budget categories.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                setIncomeInput("");
                setEditingIncome(true);
              }}
              className="bg-white text-[var(--v3-primary)] font-[Manrope] font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
            >
              Set Income
            </button>
            <Link
              href="/v3/budget"
              className="border border-white/40 text-white font-[Manrope] font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              Set Budgets
            </Link>
          </div>
          {editingIncome && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIncome(Math.max(0, parseFloat(incomeInput) || 0));
                setEditingIncome(false);
              }}
              className="flex items-center justify-center gap-3 pt-2"
            >
              <input
                autoFocus
                type="number"
                step="100"
                min="0"
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                placeholder="e.g. 45000"
                className="w-44 rounded-xl bg-white/20 border border-white/30 px-4 py-2.5 text-white placeholder-white/50 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              <button
                type="submit"
                className="bg-white text-[var(--v3-primary)] font-bold px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingIncome(false)}
                className="text-white/70 hover:text-white px-3 py-2.5 transition-colors"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Build donut chart data
  const categoryData = CATEGORIES.map((cat, i) => ({
    name: cat.name,
    icon: cat.icon,
    actual: data.budgets[cat.name]?.actual ?? 0,
    budget: data.budgets[cat.name]?.budget ?? 0,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  })).filter((c) => c.actual > 0);

  const totalForDonut = categoryData.reduce((s, c) => s + c.actual, 0);

  // SVG donut segments
  const donutSegments: { offset: number; length: number; color: string }[] = [];
  let cumulativeOffset = 0;
  const circumference = 2 * Math.PI * 40; // r=40
  for (const cat of categoryData) {
    const pct = totalForDonut > 0 ? cat.actual / totalForDonut : 0;
    const length = pct * circumference;
    donutSegments.push({ offset: cumulativeOffset, length, color: cat.color });
    cumulativeOffset += length;
  }

  const pctUsed = Math.min(totals.pct, 100);
  const isOverBudget = totals.pct > 100;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Row 1: Hero + Budget Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hero Section (2/3) */}
        <div className="lg:col-span-2 premium-gradient rounded-xl p-8 text-white relative overflow-hidden">
          {/* Decorative blur circle */}
          <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/60 font-[Manrope] mb-2">
            Cumulative Stability
          </p>

          <div className="flex items-baseline gap-3 mb-8">
            {editingIncome ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIncome(Math.max(0, parseFloat(incomeInput) || 0));
                  setEditingIncome(false);
                }}
                className="flex items-center gap-3"
              >
                <input
                  autoFocus
                  type="number"
                  step="100"
                  min="0"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  className="w-48 rounded-xl bg-white/20 border border-white/30 px-4 py-2 text-white font-mono text-2xl focus:outline-none focus:ring-2 focus:ring-white/40"
                />
                <button type="submit" className="bg-white text-[var(--v3-primary)] font-bold px-4 py-2 rounded-xl text-sm">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingIncome(false)}
                  className="text-white/70 hover:text-white text-sm"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <h2 className="font-[Manrope] text-4xl font-extrabold tracking-tight">
                {formatNOK(balance)}
              </h2>
            )}
          </div>
          <p className="text-white/60 text-sm font-[Inter] mb-6">Total Balance</p>

          {/* Glass cards */}
          <div className="grid grid-cols-2 gap-4 relative z-10">
            {/* Monthly Income */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/60 text-xs font-medium font-[Inter] uppercase tracking-wider">Monthly Income</span>
                <span className="material-symbols-outlined text-white/50 text-lg">trending_up</span>
              </div>
              <button
                onClick={() => {
                  setIncomeInput(data.income > 0 ? String(data.income) : "");
                  setEditingIncome(true);
                }}
                className="font-[Manrope] text-2xl font-bold hover:text-white/80 transition-colors"
                title="Click to edit income"
              >
                {formatNOK(data.income)}
              </button>
              <div className="flex items-center gap-1 mt-2">
                <span className="material-symbols-outlined text-[var(--v3-green-light)] text-sm">edit</span>
                <span className="text-white/50 text-xs">Click to edit</span>
              </div>
            </div>

            {/* Monthly Spending */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/60 text-xs font-medium font-[Inter] uppercase tracking-wider">Monthly Spending</span>
                <span className="material-symbols-outlined text-white/50 text-lg">trending_down</span>
              </div>
              <p className="font-[Manrope] text-2xl font-bold">
                {formatNOK(totals.totalActual)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={`material-symbols-outlined text-sm ${
                    isOverBudget ? "text-[var(--v3-red)]" : "text-[var(--v3-green-light)]"
                  }`}
                >
                  {isOverBudget ? "warning" : "check_circle"}
                </span>
                <span className="text-white/50 text-xs">
                  {isOverBudget
                    ? `${(totals.pct).toFixed(0)}% of budget used`
                    : `${totals.pct.toFixed(0)}% of budget used`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Progress Card (1/3) */}
        <div className="bg-[var(--v3-card)] rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-[Manrope] text-lg font-bold text-[var(--v3-text)]">Monthly Budget</h3>
              <p className="text-xs text-[var(--v3-text-muted)] font-[Inter] mt-0.5">{data.month}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--v3-surface-low)] flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--v3-primary)]">pie_chart</span>
            </div>
          </div>

          {/* Percentage */}
          <div className="text-center mb-4">
            <span
              className={`font-[Manrope] text-4xl font-extrabold ${
                isOverBudget ? "text-[var(--v3-red)]" : "text-[var(--v3-primary)]"
              }`}
            >
              {totals.pct.toFixed(0)}%
            </span>
            <p className="text-xs text-[var(--v3-text-muted)] mt-1">of budget used</p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 rounded-full bg-[var(--v3-surface-high)] mb-6 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget ? "bg-[var(--v3-red)]" : "bg-[var(--v3-primary)]"
              }`}
              style={{ width: `${Math.min(totals.pct, 100)}%` }}
            />
          </div>

          {/* Stats */}
          <div className="space-y-3 flex-grow">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--v3-text-muted)] font-[Inter]">Remaining</span>
              <span
                className={`text-sm font-bold font-mono ${
                  totals.budgetRemaining < 0 ? "text-[var(--v3-red)]" : "text-[var(--v3-green)]"
                }`}
              >
                {formatNOK(totals.budgetRemaining)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--v3-text-muted)] font-[Inter]">Total Limit</span>
              <span className="text-sm font-bold font-mono text-[var(--v3-text)]">
                {formatNOK(totals.totalBudget)}
              </span>
            </div>
          </div>

          {/* Adjust Limits link */}
          <Link
            href="/v3/budget"
            className="mt-6 flex items-center justify-center gap-2 text-sm font-bold font-[Manrope] text-[var(--v3-primary)] hover:text-[var(--v3-primary-alt)] transition-colors py-2.5 rounded-xl border border-[var(--v3-border)] hover:border-[var(--v3-primary)]"
          >
            <span className="material-symbols-outlined text-lg">tune</span>
            Adjust Limits
          </Link>
        </div>
      </div>

      {/* Row 2: Spending by Category + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <div className="bg-[var(--v3-card)] rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[Manrope] text-lg font-bold text-[var(--v3-text)]">Spending by Category</h3>
            <span className="material-symbols-outlined text-[var(--v3-text-muted)]">donut_large</span>
          </div>

          {totalForDonut === 0 ? (
            <div className="text-center py-12 text-[var(--v3-text-muted)]">
              <span className="material-symbols-outlined text-4xl opacity-40 mb-3 block">category</span>
              <p className="text-sm">No spending recorded yet.</p>
              <p className="text-xs mt-1 opacity-60">Add actuals in the Budget Planner to see your breakdown.</p>
            </div>
          ) : (
            <div className="flex items-center gap-8">
              {/* Donut Chart */}
              <div className="relative flex-shrink-0">
                <svg width="160" height="160" viewBox="0 0 100 100" className="-rotate-90">
                  {/* Background ring */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--v3-surface-high)" strokeWidth="12" />
                  {/* Segments */}
                  {donutSegments.map((seg, i) => (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="12"
                      strokeDasharray={`${seg.length} ${circumference - seg.length}`}
                      strokeDashoffset={-seg.offset}
                      strokeLinecap="butt"
                    />
                  ))}
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-[Manrope] text-lg font-extrabold text-[var(--v3-text)]">
                    {formatNOK(totalForDonut)}
                  </span>
                  <span className="text-[10px] text-[var(--v3-text-muted)]">Total Spent</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-grow space-y-2 max-h-[160px] overflow-y-auto">
                {categoryData.map((cat) => {
                  const pct = totalForDonut > 0 ? ((cat.actual / totalForDonut) * 100).toFixed(0) : "0";
                  return (
                    <div key={cat.name} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[var(--v3-text)] truncate">{cat.name}</span>
                          <span className="text-xs text-[var(--v3-text-muted)] ml-2 flex-shrink-0">{pct}%</span>
                        </div>
                        <span className="text-[11px] font-mono text-[var(--v3-text-muted)]">{formatNOK(cat.actual)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-[var(--v3-card)] rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[Manrope] text-lg font-bold text-[var(--v3-text)]">Recent Transactions</h3>
            <Link
              href="/v3/transactions"
              className="text-xs font-bold text-[var(--v3-primary)] hover:text-[var(--v3-primary-alt)] font-[Manrope] flex items-center gap-1"
            >
              View All
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-12 text-[var(--v3-text-muted)]">
              <span className="material-symbols-outlined text-4xl opacity-40 mb-3 block">receipt_long</span>
              <p className="text-sm">No transactions yet.</p>
              <p className="text-xs mt-1 opacity-60">
                Add transactions to track your spending.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentTransactions.map((tx) => {
                const catMeta = CATEGORIES.find((c) => c.name === tx.category);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 py-3 border-b border-[var(--v3-surface-high)] last:border-0"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--v3-surface-low)] flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[var(--v3-primary)] text-lg">
                        {catMeta?.icon ?? "receipt"}
                      </span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium text-[var(--v3-text)] truncate">{tx.description}</p>
                      <p className="text-xs text-[var(--v3-text-muted)]">
                        {tx.category} &middot; {tx.date}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold font-mono flex-shrink-0 ${
                        tx.amount < 0 ? "text-[var(--v3-red)]" : "text-[var(--v3-green)]"
                      }`}
                    >
                      {tx.amount < 0 ? "−" : "+"}{formatNOK(Math.abs(tx.amount))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
