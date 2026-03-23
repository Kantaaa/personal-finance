"use client";

import { useState, useEffect } from "react";
import { useV3Store, formatNOK, CATEGORIES } from "@/app/v3/lib/store";

function getMonthLabel(): string {
  const d = new Date();
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function getGrade(pct: number): { letter: string; label: string } {
  if (pct <= 50) return { letter: "A+", label: "Outstanding" };
  if (pct <= 70) return { letter: "A-", label: "Excellent" };
  if (pct <= 85) return { letter: "B", label: "Good" };
  if (pct <= 100) return { letter: "C", label: "Fair" };
  return { letter: "D", label: "Over Budget" };
}

function gradeColor(letter: string): string {
  if (letter.startsWith("A")) return "text-[var(--v3-green)]";
  if (letter === "B") return "text-[var(--v3-primary)]";
  if (letter === "C") return "text-[#7c5800]";
  return "text-[var(--v3-red)]";
}

const NOTES_KEY = "pf-v3-notes";

export default function ReviewPage() {
  const { loaded, totals, effectiveBudgets, archiveAndReset } = useV3Store();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(NOTES_KEY);
    if (saved) setNotes(saved); // eslint-disable-line react-hooks/set-state-in-effect -- hydration-safe
  }, []);

  useEffect(() => {
    localStorage.setItem(NOTES_KEY, notes);
  }, [notes]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--v3-bg)]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--v3-primary)] border-t-transparent" />
      </div>
    );
  }

  const { totalBudget, totalActual, remaining, budgetRemaining, pct } = totals;
  const grade = getGrade(pct);
  const extraSavings = remaining > 0 ? remaining : 0;
  const variance = totalBudget - totalActual;

  // Build wins and alerts from category data
  const wins = CATEGORIES.map((cat) => {
    const entry = effectiveBudgets[cat.name];
    if (!entry || entry.budget <= 0) return null;
    const saved = entry.budget - entry.actual;
    if (saved <= 0) return null;
    return { ...cat, saved, entry };
  })
    .filter(Boolean)
    .sort((a, b) => b!.saved - a!.saved) as {
    name: string;
    icon: string;
    group: string;
    saved: number;
    entry: { budget: number; actual: number };
  }[];

  const alerts = CATEGORIES.map((cat) => {
    const entry = effectiveBudgets[cat.name];
    if (!entry || entry.budget <= 0) return null;
    const overspend = entry.actual - entry.budget;
    if (overspend <= 0) return null;
    return { ...cat, overspend, entry };
  })
    .filter(Boolean)
    .sort((a, b) => b!.overspend - a!.overspend) as {
    name: string;
    icon: string;
    group: string;
    overspend: number;
    entry: { budget: number; actual: number };
  }[];

  const spendPct = totalBudget > 0 ? Math.min((totalActual / totalBudget) * 100, 100) : 0;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      {/* ── Hero Section ── */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <p className="text-sm font-medium tracking-wide uppercase text-[var(--v3-text-muted)]">
            {getMonthLabel()} Review
          </p>
          <h1 className="text-3xl md:text-4xl font-bold font-[Manrope] text-[var(--v3-text)]">
            The Co-Pilot View
          </h1>
          <p className="text-[var(--v3-text-muted)] max-w-lg leading-relaxed">
            Here&apos;s your monthly snapshot. See where you crushed it, where to
            adjust, and plan your next move.
          </p>
        </div>
        <button
          onClick={() => {
            if (window.confirm("Start a fresh month? Current data will be archived to Historical Trends before resetting.")) {
              archiveAndReset();
            }
          }}
          className="shrink-0 px-6 py-3 rounded-xl font-semibold text-white bg-[var(--v3-primary)] hover:bg-[var(--v3-primary-alt)] transition-colors"
        >
          <span className="material-symbols-outlined align-middle mr-1 text-[20px]">
            restart_alt
          </span>
          Finish Review
        </button>
      </section>

      {/* ── Bento Performance Grid ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main card: Spending vs Plan */}
        <div className="lg:col-span-2 bg-[var(--v3-card)] rounded-2xl border border-[var(--v3-border)] p-6 space-y-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--v3-primary)]">monitoring</span>
            <h2 className="text-xl font-bold font-[Manrope] text-[var(--v3-text)]">
              Spending vs. Plan
            </h2>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[var(--v3-surface-low)] rounded-xl p-4">
              <p className="text-xs text-[var(--v3-text-muted)] uppercase tracking-wide">Planned</p>
              <p className="text-lg font-bold font-[Manrope] text-[var(--v3-text)]">
                {formatNOK(totalBudget)}
              </p>
            </div>
            <div className="bg-[var(--v3-surface-low)] rounded-xl p-4">
              <p className="text-xs text-[var(--v3-text-muted)] uppercase tracking-wide">Actual</p>
              <p className="text-lg font-bold font-[Manrope] text-[var(--v3-text)]">
                {formatNOK(totalActual)}
              </p>
            </div>
            <div
              className={`rounded-xl p-4 ${
                variance >= 0 ? "bg-[var(--v3-green-light)]/20" : "bg-[var(--v3-red-container)]"
              }`}
            >
              <p className="text-xs text-[var(--v3-text-muted)] uppercase tracking-wide">Variance</p>
              <p
                className={`text-lg font-bold font-[Manrope] ${
                  variance >= 0 ? "text-[var(--v3-green)]" : "text-[var(--v3-red)]"
                }`}
              >
                {variance >= 0 ? "+" : ""}
                {formatNOK(variance)}
              </p>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-[var(--v3-text-muted)]">
              <span>Budget utilisation</span>
              <span className="font-semibold">{pct.toFixed(0)}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-[var(--v3-surface-high)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct <= 85
                    ? "bg-[var(--v3-primary)]"
                    : pct <= 100
                    ? "bg-[#7c5800]"
                    : "bg-[var(--v3-red)]"
                }`}
                style={{ width: `${spendPct}%` }}
              />
            </div>
          </div>

          {/* Per-category bars */}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {CATEGORIES.map((cat) => {
              const entry = effectiveBudgets[cat.name];
              if (!entry || entry.budget <= 0) return null;
              const catPct = Math.min((entry.actual / entry.budget) * 100, 100);
              const over = entry.actual > entry.budget;
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-[var(--v3-text)]">
                      <span className="material-symbols-outlined text-[16px] text-[var(--v3-text-muted)]">
                        {cat.icon}
                      </span>
                      {cat.name}
                    </span>
                    <span className={`font-medium ${over ? "text-[var(--v3-red)]" : "text-[var(--v3-text-muted)]"}`}>
                      {formatNOK(entry.actual)} / {formatNOK(entry.budget)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--v3-surface-high)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        over ? "bg-[var(--v3-red)]" : "bg-[var(--v3-primary-alt)]"
                      }`}
                      style={{ width: `${catPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Quick stats */}
        <div className="space-y-6">
          {/* Extra Savings */}
          <div className="bg-[var(--v3-card)] rounded-2xl border border-[var(--v3-border)] p-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--v3-green)]">savings</span>
              <h3 className="font-semibold font-[Manrope] text-[var(--v3-text)]">Extra Savings</h3>
            </div>
            <p className="text-3xl font-bold font-[Manrope] text-[var(--v3-green)]">
              {formatNOK(extraSavings)}
            </p>
            <p className="text-sm text-[var(--v3-text-muted)]">
              {extraSavings > 0
                ? "Income left after all spending this month."
                : "No surplus this month — spending matched or exceeded income."}
            </p>
          </div>

          {/* Financial Health Grade */}
          <div className="bg-[var(--v3-card)] rounded-2xl border border-[var(--v3-border)] p-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--v3-primary)]">military_tech</span>
              <h3 className="font-semibold font-[Manrope] text-[var(--v3-text)]">Financial Health</h3>
            </div>
            <div className="flex items-baseline gap-3">
              <span
                className={`text-5xl font-extrabold font-[Manrope] ${gradeColor(grade.letter)}`}
              >
                {grade.letter}
              </span>
              <span className="text-[var(--v3-text-muted)] font-medium">{grade.label}</span>
            </div>
            <p className="text-sm text-[var(--v3-text-muted)]">
              Based on {pct.toFixed(0)}% budget utilisation.
            </p>
          </div>

          {/* Budget Remaining */}
          <div className="bg-[var(--v3-card)] rounded-2xl border border-[var(--v3-border)] p-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--v3-primary)]">account_balance</span>
              <h3 className="font-semibold font-[Manrope] text-[var(--v3-text)]">Budget Remaining</h3>
            </div>
            <p
              className={`text-2xl font-bold font-[Manrope] ${
                budgetRemaining >= 0 ? "text-[var(--v3-green)]" : "text-[var(--v3-red)]"
              }`}
            >
              {formatNOK(budgetRemaining)}
            </p>
            <p className="text-sm text-[var(--v3-text-muted)]">
              {budgetRemaining >= 0
                ? "Still available within your planned budget."
                : "You've exceeded your planned budget."}
            </p>
          </div>
        </div>
      </section>

      {/* ── Wins & Alerts ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wins */}
        <div className="bg-[var(--v3-card)] rounded-2xl border border-[var(--v3-border)] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--v3-green)]">emoji_events</span>
            <h2 className="text-xl font-bold font-[Manrope] text-[var(--v3-text)]">Wins</h2>
          </div>
          {wins.length === 0 ? (
            <p className="text-sm text-[var(--v3-text-muted)] italic">
              No under-budget categories this month.
            </p>
          ) : (
            <ul className="space-y-3">
              {wins.map((w) => (
                <li
                  key={w.name}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--v3-green-light)]/10 border border-[var(--v3-green-dim)]/30"
                >
                  <span className="material-symbols-outlined text-[var(--v3-green)]">{w.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--v3-text)] text-sm">{w.name}</p>
                    <p className="text-xs text-[var(--v3-text-muted)]">
                      Spent {formatNOK(w.entry.actual)} of {formatNOK(w.entry.budget)} planned
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[var(--v3-green)] whitespace-nowrap">
                    +{formatNOK(w.saved)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-[var(--v3-card)] rounded-2xl border border-[var(--v3-border)] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--v3-red)]">warning</span>
            <h2 className="text-xl font-bold font-[Manrope] text-[var(--v3-text)]">Alerts</h2>
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-[var(--v3-text-muted)] italic">
              All categories are within budget. Nice work!
            </p>
          ) : (
            <ul className="space-y-3">
              {alerts.map((a) => (
                <li
                  key={a.name}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--v3-red-container)]/30 border border-[var(--v3-red-container)]"
                >
                  <span className="material-symbols-outlined text-[var(--v3-red-on-container)]">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--v3-text)] text-sm">{a.name}</p>
                    <p className="text-xs text-[var(--v3-text-muted)]">
                      Spent {formatNOK(a.entry.actual)} of {formatNOK(a.entry.budget)} planned
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[var(--v3-red)] whitespace-nowrap">
                    -{formatNOK(a.overspend)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Notes / Adjustment Plan ── */}
      <section className="bg-[var(--v3-card)] rounded-2xl border border-[var(--v3-border)] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--v3-primary)]">edit_note</span>
          <h2 className="text-xl font-bold font-[Manrope] text-[var(--v3-text)]">Adjustment Plan</h2>
        </div>
        <p className="text-sm text-[var(--v3-text-muted)]">
          Jot down what you&apos;d change next month — shift budget between categories, cut a
          subscription, or set a savings target.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="e.g. Move kr 500 from Eating Out to Savings, cancel streaming service..."
          className="w-full rounded-xl border border-[var(--v3-border)] bg-[var(--v3-bg)] p-4 text-sm text-[var(--v3-text)] placeholder:text-[var(--v3-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--v3-primary)] resize-y"
        />
        <div className="flex gap-3">
          <button
            onClick={() => setNotes("")}
            className="px-4 py-2 text-sm rounded-lg border border-[var(--v3-border)] text-[var(--v3-text-muted)] hover:bg-[var(--v3-surface-low)] transition-colors"
          >
            Clear Notes
          </button>
          <button
            onClick={() => {
              localStorage.setItem(NOTES_KEY, notes);
              alert("Notes saved.");
            }}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--v3-primary)] text-white font-medium hover:bg-[var(--v3-primary-alt)] transition-colors"
          >
            <span className="material-symbols-outlined align-middle mr-1 text-[16px]">save</span>
            Save Notes
          </button>
        </div>
      </section>
    </div>
  );
}
