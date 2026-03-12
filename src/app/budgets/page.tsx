"use client";

import { useState } from "react";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { useCategories } from "@/hooks/useCategories";
import { useBudgets } from "@/hooks/useBudgets";
import { useSummary } from "@/hooks/useSummary";
import { formatCurrency } from "@/lib/utils";

export default function BudgetsPage() {
  const { categories } = useCategories();
  const {
    budgets,
    isLoading,
    setBudget,
    deleteBudget,
  } = useBudgets();
  const [refDate] = useState(() => new Date());
  const { data: summary } = useSummary("month", refDate);

  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Categories that don't have a budget yet
  const budgetedNames = new Set(budgets.map((b) => b.category));
  const unbugeted = categories.filter((c) => !budgetedNames.has(c.name));

  async function handleSetBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!editCategory || !editAmount) return;
    setSaving(true);
    setError(null);
    try {
      await setBudget(editCategory, parseFloat(editAmount));
      setEditAmount("");
      setEditCategory("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (deletingId === id) {
      try {
        await deleteBudget(id);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to delete");
      }
      setDeletingId(null);
    } else {
      setDeletingId(id);
    }
  }

  // Build rows with actual spend
  const rows = budgets.map((b) => {
    const actual = Math.abs(summary?.byCategory[b.category] ?? 0);
    const pct = b.amount > 0 ? (actual / b.amount) * 100 : 0;
    const remaining = b.amount - actual;
    return { ...b, actual, pct, remaining };
  }).sort((a, b) => b.pct - a.pct);

  const totalBudget = rows.reduce((s, r) => s + r.amount, 0);
  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  const totalPct = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set monthly spending limits per category and track your progress.
          </p>
        </div>

        {/* Overall summary */}
        {rows.length > 0 && (
          <div className="mb-6 rounded-lg border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Overall this month</span>
              <div className="text-sm">
                <span className="font-mono">{formatCurrency(totalActual)}</span>
                <span className="text-muted-foreground"> / {formatCurrency(totalBudget)}</span>
                <span
                  className={`ml-2 text-xs font-semibold ${
                    totalPct > 100 ? "text-red-500" : totalPct > 80 ? "text-amber-500" : "text-green-600"
                  }`}
                >
                  {totalPct.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  totalPct > 100 ? "bg-red-500" : totalPct > 80 ? "bg-amber-500" : "bg-green-500"
                }`}
                style={{ width: `${Math.min(totalPct, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Add budget form */}
        <form onSubmit={handleSetBudget} className="mb-6 rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">
            {budgets.length === 0 ? "Set your first budget" : "Add or update budget"}
          </h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="flex-1 min-w-[180px] rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              <option value="">Select category</option>
              {unbugeted.length > 0 && (
                <optgroup label="No budget yet">
                  {unbugeted.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {budgets.length > 0 && (
                <optgroup label="Update existing">
                  {budgets.map((b) => (
                    <option key={b.id} value={b.category}>
                      {b.category} (currently {formatCurrency(b.amount)})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <input
              type="number"
              step="0.01"
              min="0"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              placeholder="Monthly limit"
              className="w-36 rounded-md border bg-background px-2 py-1.5 text-sm"
            />
            <button
              type="submit"
              disabled={!editCategory || !editAmount || saving}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Set budget"}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </form>

        {/* Budget list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg border bg-card" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-lg font-medium">No budgets yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the form above to set a monthly spending limit for a category.
              Your progress will show on the{" "}
              <Link href="/dashboard" className="text-primary hover:underline">
                dashboard
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.category}</span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-mono text-sm">
                        {formatCurrency(r.actual)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {" "}/ {formatCurrency(r.amount)}
                      </span>
                    </div>
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
                    <button
                      onClick={() => handleDelete(r.id)}
                      onBlur={() => { if (deletingId === r.id) setDeletingId(null); }}
                      className={`text-xs ${
                        deletingId === r.id
                          ? "font-medium text-destructive"
                          : "text-muted-foreground hover:text-destructive"
                      }`}
                    >
                      {deletingId === r.id ? "Confirm?" : "Delete"}
                    </button>
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
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
                  <p className="mt-1 text-xs text-red-500">
                    Over by {formatCurrency(Math.abs(r.remaining))}
                  </p>
                )}
                {r.remaining > 0 && (
                  <p className="mt-1 text-xs text-green-600">
                    {formatCurrency(r.remaining)} remaining
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
