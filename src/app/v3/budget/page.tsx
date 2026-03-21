"use client";

import { useState } from "react";
import { useV3Store, formatNOK, CATEGORIES } from "@/app/v3/lib/store";

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100);
  const color =
    pct > 100 ? "#ba1a1a" : pct >= 80 ? "#b5890a" : "#005315";
  const bgColor =
    pct > 100 ? "#ffdad6" : pct >= 80 ? "#fff3cd" : "#7edb7e33";

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: bgColor }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-xs font-semibold tabular-nums w-10 text-right"
        style={{ color }}
      >
        {Math.round(pct)}%
      </span>
    </div>
  );
}

function InlineNumberInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      value={value || ""}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      placeholder="0"
      className="w-24 bg-transparent text-right tabular-nums text-sm font-medium px-2 py-1.5 rounded-lg border border-transparent focus:border-[var(--v3-primary-alt)] focus:bg-[var(--v3-card)] focus:outline-none focus:ring-1 focus:ring-[var(--v3-primary-alt)]/30 transition-all placeholder:text-[var(--v3-outline)]"
    />
  );
}

export default function BudgetPlannerPage() {
  const { data, loaded, totals, setIncome, setBudget, setActual } = useV3Store();
  const [incomeInput, setIncomeInput] = useState<string>("");
  const [showIncomeEditor, setShowIncomeEditor] = useState(false);

  if (!loaded) {
    return (
      <div className="p-6 lg:p-10 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[var(--v3-primary-alt)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--v3-text-muted)] font-medium">Loading budget data...</p>
        </div>
      </div>
    );
  }

  const handleSetIncome = () => {
    const val = Number(incomeInput);
    if (val > 0) {
      setIncome(val);
      setShowIncomeEditor(false);
      setIncomeInput("");
    }
  };

  // Top 5 categories by actual spend for the trend chart
  const trendCategories = [...CATEGORIES]
    .map((c) => ({ ...c, actual: data.budgets[c.name]?.actual ?? 0, budget: data.budgets[c.name]?.budget ?? 0 }))
    .sort((a, b) => b.actual - a.actual)
    .slice(0, 5);
  const maxTrend = Math.max(...trendCategories.map((c) => Math.max(c.actual, c.budget)), 1);

  return (
    <div className="p-6 lg:p-10 space-y-10">
      {/* ── Section 1: Summary Bento ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hero Card */}
        <div className="lg:col-span-2 premium-gradient rounded-2xl p-8 text-white relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute bottom-4 right-8 w-24 h-24 rounded-full bg-white/5" />
          <div className="absolute top-6 right-6">
            <span className="material-symbols-outlined text-white/20 text-[80px]">
              account_balance_wallet
            </span>
          </div>

          <div className="relative z-10 space-y-6">
            <div>
              <p className="text-sm font-medium text-white/70 uppercase tracking-wider">
                Total Monthly Target
              </p>
              <h2 className="text-4xl font-[Manrope] font-extrabold tracking-tight mt-1">
                {formatNOK(totals.totalBudget)}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4">
                <p className="text-xs text-white/60 uppercase tracking-wider font-medium">Spent to Date</p>
                <p className="text-2xl font-[Manrope] font-bold mt-1">{formatNOK(totals.totalActual)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4">
                <p className="text-xs text-white/60 uppercase tracking-wider font-medium">Budget Remaining</p>
                <p
                  className="text-2xl font-[Manrope] font-bold mt-1"
                  style={{ color: totals.budgetRemaining < 0 ? "#ffdad6" : "white" }}
                >
                  {formatNOK(totals.budgetRemaining)}
                </p>
              </div>
            </div>

            {/* Global progress */}
            <div>
              <div className="flex justify-between text-xs text-white/60 mb-1.5">
                <span>Overall progress</span>
                <span>{Math.round(totals.pct)}%</span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(totals.pct, 100)}%`,
                    backgroundColor: totals.pct > 100 ? "#ffdad6" : "#7edb7e",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Card - Quick Start */}
        <div className="bg-[var(--v3-card)] rounded-2xl p-6 shadow-sm border border-[var(--v3-surface-high)] flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--v3-secondary-container)] flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--v3-secondary)]">bolt</span>
            </div>
            <h3 className="font-[Manrope] font-bold text-[var(--v3-text)]">Quick Start</h3>
          </div>

          {data.income > 0 && !showIncomeEditor ? (
            <div className="flex-1 flex flex-col">
              <p className="text-xs text-[var(--v3-text-muted)] uppercase tracking-wider font-medium mb-1">
                Monthly Income
              </p>
              <p className="text-3xl font-[Manrope] font-extrabold text-[var(--v3-primary)] mb-3">
                {formatNOK(data.income)}
              </p>
              <div className="bg-[var(--v3-surface-low)] rounded-xl p-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--v3-text-muted)]">Unallocated</span>
                  <span className="font-semibold text-[var(--v3-primary)]">
                    {formatNOK(data.income - totals.totalBudget)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIncomeInput(String(data.income));
                  setShowIncomeEditor(true);
                }}
                className="mt-auto text-sm text-[var(--v3-secondary)] hover:text-[var(--v3-primary)] font-medium flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit income
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-sm text-[var(--v3-text-muted)] mb-4">
                Set your monthly income to start planning your budget.
              </p>
              <div className="space-y-3">
                <input
                  type="number"
                  min={0}
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSetIncome()}
                  placeholder="e.g. 45 000"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--v3-border)] bg-[var(--v3-surface-low)] text-[var(--v3-text)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--v3-primary-alt)]/40 focus:border-[var(--v3-primary-alt)] transition-all placeholder:text-[var(--v3-outline)]"
                />
                <button
                  onClick={handleSetIncome}
                  className="w-full py-3 bg-[var(--v3-primary)] hover:bg-[var(--v3-primary-alt)] text-white font-[Manrope] font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  Set Income
                </button>
                {showIncomeEditor && (
                  <button
                    onClick={() => setShowIncomeEditor(false)}
                    className="w-full text-sm text-[var(--v3-outline)] hover:text-[var(--v3-text-muted)] transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 2: Category Breakdown Table ── */}
      <div className="bg-[var(--v3-card)] rounded-2xl shadow-sm border border-[var(--v3-surface-high)] overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--v3-surface-high)]">
          <h3 className="font-[Manrope] font-bold text-lg text-[var(--v3-text)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--v3-primary-alt)]">category</span>
            Category Breakdown
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--v3-surface-low)]">
                <th className="text-left text-xs font-semibold text-[var(--v3-text-muted)] uppercase tracking-wider px-6 py-3">
                  Category
                </th>
                <th className="text-right text-xs font-semibold text-[var(--v3-text-muted)] uppercase tracking-wider px-6 py-3">
                  Target
                </th>
                <th className="text-right text-xs font-semibold text-[var(--v3-text-muted)] uppercase tracking-wider px-6 py-3">
                  Actual
                </th>
                <th className="text-left text-xs font-semibold text-[var(--v3-text-muted)] uppercase tracking-wider px-6 py-3 min-w-[160px]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--v3-surface-high)]">
              {CATEGORIES.map((cat) => {
                const entry = data.budgets[cat.name] ?? { budget: 0, actual: 0 };
                const pct = entry.budget > 0 ? (entry.actual / entry.budget) * 100 : 0;

                return (
                  <tr
                    key={cat.name}
                    className="hover:bg-[var(--v3-bg)] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[var(--v3-surface-low)] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[var(--v3-primary-alt)] text-[20px]">
                            {cat.icon}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--v3-text)]">{cat.name}</p>
                          <p className="text-[11px] text-[var(--v3-outline)]">{cat.group}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <InlineNumberInput
                        value={entry.budget}
                        onChange={(v) => setBudget(cat.name, v)}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <InlineNumberInput
                        value={entry.actual}
                        onChange={(v) => setActual(cat.name, v)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <ProgressBar pct={pct} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[var(--v3-surface-low)] font-semibold">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--v3-primary)] flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[20px]">
                        functions
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[var(--v3-text)]">Grand Total</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-[var(--v3-text)] tabular-nums">
                  {formatNOK(totals.totalBudget)}
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-[var(--v3-text)] tabular-nums">
                  {formatNOK(totals.totalActual)}
                </td>
                <td className="px-6 py-4">
                  <ProgressBar pct={totals.pct} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Section 3: Secondary Insight Bento Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trends - Placeholder Bar Chart */}
        <div className="lg:col-span-2 bg-[var(--v3-card)] rounded-2xl shadow-sm border border-[var(--v3-surface-high)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[Manrope] font-bold text-[var(--v3-text)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--v3-primary-alt)]">bar_chart</span>
              Spending Trends
            </h3>
            <span className="text-xs text-[var(--v3-outline)] bg-[var(--v3-surface-low)] px-3 py-1 rounded-full font-medium">
              Top 5 Categories
            </span>
          </div>

          <div className="space-y-4">
            {trendCategories.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[var(--v3-primary-alt)]">
                      {cat.icon}
                    </span>
                    <span className="font-medium text-[var(--v3-text)]">{cat.name}</span>
                  </div>
                  <span className="text-[var(--v3-text-muted)] tabular-nums">
                    {formatNOK(cat.actual)} / {formatNOK(cat.budget)}
                  </span>
                </div>
                <div className="relative h-6 bg-[var(--v3-surface-low)] rounded-lg overflow-hidden">
                  {/* Budget bar (background) */}
                  <div
                    className="absolute inset-y-0 left-0 bg-[var(--v3-border)]/40 rounded-lg"
                    style={{ width: `${(cat.budget / maxTrend) * 100}%` }}
                  />
                  {/* Actual bar (foreground) */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
                    style={{
                      width: `${(cat.actual / maxTrend) * 100}%`,
                      backgroundColor:
                        cat.budget > 0 && cat.actual > cat.budget
                          ? "#ba1a1a"
                          : cat.budget > 0 && cat.actual >= cat.budget * 0.8
                          ? "#b5890a"
                          : "#005315",
                    }}
                  />
                </div>
              </div>
            ))}
            {trendCategories.every((c) => c.actual === 0 && c.budget === 0) && (
              <div className="text-center py-8 text-sm text-[var(--v3-outline)]">
                <span className="material-symbols-outlined text-[40px] text-[var(--v3-border)] block mb-2">
                  show_chart
                </span>
                Add budget targets and actuals to see trends
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-[var(--v3-surface-high)]">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--v3-text-muted)]">
              <span className="w-3 h-3 rounded bg-[var(--v3-green)] inline-block" /> Actual
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--v3-text-muted)]">
              <span className="w-3 h-3 rounded bg-[var(--v3-border)]/40 inline-block" /> Target
            </div>
          </div>
        </div>

        {/* Right column: Two small cards */}
        <div className="space-y-6">
          {/* Savings Goal Card */}
          <div className="bg-[var(--v3-card)] rounded-2xl shadow-sm border border-[var(--v3-surface-high)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--v3-green-dim)]/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--v3-green)]">savings</span>
              </div>
              <h3 className="font-[Manrope] font-bold text-[var(--v3-text)] text-sm">Savings Goal</h3>
            </div>
            {(data.budgets["Savings"]?.budget ?? 0) > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--v3-text-muted)]">Target</span>
                  <span className="font-semibold text-[var(--v3-green)]">
                    {formatNOK(data.budgets["Savings"].budget)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--v3-text-muted)]">Saved</span>
                  <span className="font-semibold text-[var(--v3-text)]">
                    {formatNOK(data.budgets["Savings"].actual)}
                  </span>
                </div>
                <ProgressBar
                  pct={
                    data.budgets["Savings"].budget > 0
                      ? (data.budgets["Savings"].actual / data.budgets["Savings"].budget) * 100
                      : 0
                  }
                />
              </div>
            ) : (
              <p className="text-sm text-[var(--v3-outline)]">
                Set a savings target in the table above to track your progress.
              </p>
            )}
          </div>

          {/* Upcoming Bills Card */}
          <div className="bg-[var(--v3-card)] rounded-2xl shadow-sm border border-[var(--v3-surface-high)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--v3-secondary-container)]/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--v3-secondary)]">receipt_long</span>
              </div>
              <h3 className="font-[Manrope] font-bold text-[var(--v3-text)] text-sm">Upcoming Bills</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "Rent & Utilities", icon: "home", amount: data.budgets["Rent & Utilities"]?.budget ?? 0 },
                { label: "Insurance", icon: "shield", amount: data.budgets["Insurance"]?.budget ?? 0 },
                { label: "Subscriptions", icon: "subscriptions", amount: data.budgets["Subscriptions"]?.budget ?? 0 },
              ]
                .filter((b) => b.amount > 0)
                .map((bill) => (
                  <div key={bill.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-[16px] text-[var(--v3-outline)]">
                        {bill.icon}
                      </span>
                      <span className="text-[var(--v3-text-muted)]">{bill.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--v3-text)] tabular-nums">
                      {formatNOK(bill.amount)}
                    </span>
                  </div>
                ))}
              {[data.budgets["Rent & Utilities"]?.budget, data.budgets["Insurance"]?.budget, data.budgets["Subscriptions"]?.budget].every(
                (v) => !v
              ) && (
                <p className="text-sm text-[var(--v3-outline)]">
                  Set fixed-cost budgets to see upcoming bills here.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
