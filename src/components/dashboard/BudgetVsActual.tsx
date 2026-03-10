"use client";

import Link from "next/link";
import type { Summary } from "@/hooks/useSummary";
import { formatCurrency } from "@/lib/utils";

interface BudgetVsActualProps {
  summary: Summary | undefined;
  budgetByCategory: Record<string, number>;
  isLoading: boolean;
}

export function BudgetVsActual({
  summary,
  budgetByCategory,
  isLoading,
}: BudgetVsActualProps) {
  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-lg border bg-card" />;
  }

  const budgetCategories = Object.keys(budgetByCategory);
  if (budgetCategories.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 font-semibold">Budget vs Actual</h2>
        <p className="text-sm text-muted-foreground">
          No budgets set.{" "}
          <Link href="/budgets" className="text-primary hover:underline">
            Set up budgets
          </Link>{" "}
          to track your spending limits.
        </p>
      </div>
    );
  }

  // Build rows: each budgeted category with actual spend
  const rows = budgetCategories
    .map((category) => {
      const budget = budgetByCategory[category];
      const actual = Math.abs(summary?.byCategory[category] ?? 0);
      const pct = budget > 0 ? (actual / budget) * 100 : 0;
      const remaining = budget - actual;
      return { category, budget, actual, pct, remaining };
    })
    .sort((a, b) => b.pct - a.pct); // most over-budget first

  const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  const totalPct = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Budget vs Actual</h2>
        <div className="text-xs text-muted-foreground">
          {formatCurrency(totalActual)} / {formatCurrency(totalBudget)}
          <span
            className={`ml-1.5 font-semibold ${
              totalPct > 100 ? "text-red-500" : "text-green-600"
            }`}
          >
            ({totalPct.toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="mb-4">
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              totalPct > 100 ? "bg-red-500" : totalPct > 80 ? "bg-amber-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(totalPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Per-category rows */}
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.category}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{r.category}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">
                  {formatCurrency(r.actual)} / {formatCurrency(r.budget)}
                </span>
                <span
                  className={`min-w-[3rem] text-right text-xs font-semibold ${
                    r.pct > 100
                      ? "text-red-500"
                      : r.pct > 80
                        ? "text-amber-500"
                        : "text-green-600"
                  }`}
                >
                  {r.pct.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  r.pct > 100
                    ? "bg-red-500"
                    : r.pct > 80
                      ? "bg-amber-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${Math.min(r.pct, 100)}%` }}
              />
            </div>
            {r.remaining < 0 && (
              <p className="mt-0.5 text-xs text-red-500">
                Over by {formatCurrency(Math.abs(r.remaining))}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
