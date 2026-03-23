"use client";

import { useState, useRef, useEffect } from "react";
import { useV3Store, formatNOK, CATEGORIES } from "@/app/v3/lib/store";

/* ── Shared Sub-components ─────────────────────────────────── */

function InlineNumberInput({
  value,
  onChange,
  className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  return (
    <input
      type="number"
      min={0}
      value={value || ""}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      placeholder="0"
      className={`w-24 bg-transparent text-right tabular-nums text-sm font-medium px-2 py-1.5 rounded-lg border border-transparent focus:border-[var(--v3-primary-alt)] focus:bg-[var(--v3-card)] focus:outline-none focus:ring-1 focus:ring-[var(--v3-primary-alt)]/30 transition-all placeholder:text-[var(--v3-outline)] ${className}`}
    />
  );
}

/* ── Income Source Card ─────────────────────────────────────── */

const BORDER_COLORS = [
  "var(--v3-primary)",
  "var(--v3-secondary)",
  "var(--v3-green)",
  "#b5890a",
  "#7c3aed",
];

const INCOME_ICONS = ["person", "person_4", "work", "account_balance", "payments"];

function IncomeCard({
  label,
  amount,
  index,
  onEdit,
  onRemove,
}: {
  label: string;
  amount: number;
  index: number;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const borderColor = BORDER_COLORS[index % BORDER_COLORS.length];
  const icon = INCOME_ICONS[index % INCOME_ICONS.length];

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg transition-all hover:shadow-sm"
      style={{
        backgroundColor: "var(--v3-surface-low)",
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      <div className="space-y-0.5 min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--v3-text-muted)" }}>
          {label}
        </p>
        <div className="flex items-center gap-2 group cursor-pointer" onClick={onEdit}>
          <span className="text-xl font-extrabold" style={{ color: borderColor }}>
            {formatNOK(amount)}
          </span>
          <span
            className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--v3-outline)" }}
          >
            edit
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, ${borderColor} 10%, transparent)`, color: borderColor }}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <button
          onClick={onRemove}
          className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
          style={{ color: "var(--v3-red)" }}
          title="Remove income"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
}

/* ── Add / Edit Income Dialog ──────────────────────────────── */

function IncomeDialog({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (label: string, amount: number) => void;
  initial?: { label: string; amount: number };
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form when dialog opens
      setLabel(initial?.label ?? "");
      setAmount(initial?.amount ? String(initial.amount) : "");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, initial?.label, initial?.amount]);

  if (!open) return null;

  const handleSubmit = () => {
    const trimmed = label.trim();
    const val = Number(amount);
    if (trimmed && val > 0) {
      onSave(trimmed, val);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md mx-4 p-6 rounded-2xl shadow-2xl space-y-4"
        style={{ backgroundColor: "var(--v3-card)" }}
      >
        <h3 className="font-[Manrope] font-bold text-lg" style={{ color: "var(--v3-text)" }}>
          {initial ? "Edit Income Source" : "Add Income Source"}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--v3-text-muted)" }}>
              Label
            </label>
            <input
              ref={inputRef}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Partner 1 (Salary)"
              className="w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: "var(--v3-border)",
                backgroundColor: "var(--v3-surface-low)",
                color: "var(--v3-text)",
              }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--v3-text-muted)" }}>
              Monthly Amount
            </label>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="e.g. 30 000"
              className="w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: "var(--v3-border)",
                backgroundColor: "var(--v3-surface-low)",
                color: "var(--v3-text)",
              }}
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{ color: "var(--v3-text-muted)", backgroundColor: "var(--v3-surface-low)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
            style={{ backgroundColor: "var(--v3-primary)" }}
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            {initial ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Save Template Dialog ──────────────────────────────────── */

function SaveTemplateDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(""); // eslint-disable-line react-hooks/set-state-in-effect -- reset form
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed) {
      onSave(trimmed);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md mx-4 p-6 rounded-2xl shadow-2xl space-y-4"
        style={{ backgroundColor: "var(--v3-card)" }}
      >
        <h3 className="font-[Manrope] font-bold text-lg" style={{ color: "var(--v3-text)" }}>
          Save as Template
        </h3>
        <p className="text-sm" style={{ color: "var(--v3-text-muted)" }}>
          Templates save all income sources and category targets. Perfect for seasonal budgets like holidays or vacations.
        </p>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--v3-text-muted)" }}>
            Template Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="e.g. Christmas Budget, Summer Vacation"
            className="w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all"
            style={{
              borderColor: "var(--v3-border)",
              backgroundColor: "var(--v3-surface-low)",
              color: "var(--v3-text)",
            }}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{ color: "var(--v3-text-muted)", backgroundColor: "var(--v3-surface-low)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
            style={{ backgroundColor: "var(--v3-primary)" }}
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function BudgetPlannerPage() {
  const {
    data, loaded, totals, effectiveBudgets, computedActuals, templates,
    addIncome, updateIncome, removeIncome,
    setBudget, setActual,
    saveTemplate, loadTemplate, deleteTemplate,
  } = useV3Store();

  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<{ id: string; label: string; amount: number } | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  // Close template dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setTemplateMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

  const totalIncome = data.incomes.reduce((s, i) => s + i.amount, 0);
  const unallocated = totalIncome - totals.totalBudget;
  const allocPct = totalIncome > 0 ? ((totals.totalBudget / totalIncome) * 100) : 0;

  // Top 5 categories by actual spend for the trend chart
  const trendCategories = [...CATEGORIES]
    .map((c) => ({ ...c, actual: effectiveBudgets[c.name]?.actual ?? 0, budget: effectiveBudgets[c.name]?.budget ?? 0 }))
    .sort((a, b) => b.actual - a.actual)
    .slice(0, 5);
  const maxTrend = Math.max(...trendCategories.map((c) => Math.max(c.actual, c.budget)), 1);

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* ── Templates & Config Bar ── */}
      <section
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border"
        style={{ backgroundColor: "color-mix(in srgb, var(--v3-surface-low) 50%, transparent)", borderColor: "var(--v3-border)" }}
      >
        <div className="flex items-center gap-4 flex-wrap">
          {/* Template dropdown */}
          <div className="relative" ref={templateRef}>
            <button
              onClick={() => setTemplateMenuOpen(!templateMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors hover:border-[var(--v3-primary)]"
              style={{ backgroundColor: "var(--v3-card)", borderColor: "var(--v3-border)", color: "var(--v3-text)" }}
            >
              <span className="material-symbols-outlined text-lg" style={{ color: "var(--v3-primary)" }}>auto_awesome_motion</span>
              Load Template
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>

            {templateMenuOpen && (
              <div
                className="absolute top-full left-0 mt-2 w-72 rounded-xl shadow-xl border z-50 overflow-hidden"
                style={{ backgroundColor: "var(--v3-card)", borderColor: "var(--v3-border)" }}
              >
                {templates.length === 0 ? (
                  <div className="p-4 text-sm" style={{ color: "var(--v3-outline)" }}>
                    No templates saved yet. Save your current budget as a template to reuse it later.
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {templates.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-[var(--v3-surface-low)] transition-colors cursor-pointer group"
                      >
                        <button
                          onClick={() => { loadTemplate(t.id); setTemplateMenuOpen(false); }}
                          className="flex-1 text-left"
                        >
                          <p className="text-sm font-semibold" style={{ color: "var(--v3-text)" }}>{t.name}</p>
                          <p className="text-[10px]" style={{ color: "var(--v3-outline)" }}>
                            {t.incomes.length} income{t.incomes.length !== 1 ? "s" : ""} &middot; {formatNOK(t.incomes.reduce((s, i) => s + i.amount, 0))}
                          </p>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: "var(--v3-red)" }}
                          title="Delete template"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setSaveDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors hover:bg-[var(--v3-primary)]/5"
            style={{ color: "var(--v3-primary)" }}
          >
            <span className="material-symbols-outlined text-lg">save</span>
            Save as Template
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--v3-text-muted)" }}>
            {data.month}
          </span>
        </div>
      </section>

      {/* ── Income Sources + Stats Bento ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Income Sources Card */}
        <div
          className="lg:col-span-8 p-6 rounded-2xl shadow-sm border"
          style={{ backgroundColor: "var(--v3-card)", borderColor: "var(--v3-surface-high)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-[Manrope] font-bold tracking-tight" style={{ color: "var(--v3-text)" }}>
                Income Sources
              </h3>
              <p className="text-xs" style={{ color: "var(--v3-text-muted)" }}>Manage expected monthly revenue</p>
            </div>
            <button
              onClick={() => { setEditingIncome(null); setIncomeDialogOpen(true); }}
              className="flex items-center gap-1 text-sm font-bold hover:underline"
              style={{ color: "var(--v3-primary)" }}
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Income
            </button>
          </div>

          {data.incomes.length === 0 ? (
            <div className="text-center py-10">
              <span className="material-symbols-outlined text-[48px] block mb-3" style={{ color: "var(--v3-border)" }}>
                account_balance_wallet
              </span>
              <p className="text-sm mb-4" style={{ color: "var(--v3-outline)" }}>
                No income sources added yet. Add your salary, freelance income, or other revenue streams.
              </p>
              <button
                onClick={() => { setEditingIncome(null); setIncomeDialogOpen(true); }}
                className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-colors"
                style={{ backgroundColor: "var(--v3-primary)" }}
              >
                Add Your First Income
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.incomes.map((inc, i) => (
                  <IncomeCard
                    key={inc.id}
                    label={inc.label}
                    amount={inc.amount}
                    index={i}
                    onEdit={() => {
                      setEditingIncome({ id: inc.id, label: inc.label, amount: inc.amount });
                      setIncomeDialogOpen(true);
                    }}
                    onRemove={() => removeIncome(inc.id)}
                  />
                ))}
              </div>

              <div className="mt-6 pt-6 flex items-end justify-between" style={{ borderTop: "1px solid var(--v3-surface-high)" }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--v3-text-muted)" }}>
                    Total Monthly Income
                  </p>
                  <h2 className="text-3xl font-[Manrope] font-extrabold tracking-tight" style={{ color: "var(--v3-primary)" }}>
                    {formatNOK(totalIncome)}
                  </h2>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right column: Remaining + Allocation Health */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Remaining to Allocate */}
          <div className="premium-gradient p-6 rounded-2xl shadow-lg text-white flex-1 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute bottom-4 right-8 w-24 h-24 rounded-full bg-white/5" />
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[80px] text-white/10">
              account_balance
            </span>
            <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                Remaining to Allocate
              </p>
              <h3 className="text-4xl font-[Manrope] font-black">
                {formatNOK(Math.max(0, unallocated))}
              </h3>
              {totalIncome > 0 && (
                <div className="pt-4 flex items-center gap-2">
                  <div className="h-2 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${Math.min(allocPct, 100)}%` }} />
                  </div>
                  <span className="text-[10px] font-bold">{Math.round(allocPct)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Allocation Health */}
          <div
            className="p-6 rounded-2xl shadow-sm border"
            style={{ backgroundColor: "var(--v3-card)", borderColor: "var(--v3-surface-high)" }}
          >
            <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--v3-text-muted)" }}>
              Allocation Health
            </h4>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full border-4 flex items-center justify-center shrink-0"
                style={{
                  borderColor: allocPct >= 80 ? "var(--v3-green)" : "var(--v3-primary)",
                  borderRightColor: "var(--v3-border)",
                  color: allocPct >= 80 ? "var(--v3-green)" : "var(--v3-primary)",
                }}
              >
                <span className="text-xs font-bold">{Math.round(allocPct)}%</span>
              </div>
              <p className="text-sm font-medium leading-tight" style={{ color: "var(--v3-text)" }}>
                {allocPct === 0
                  ? "Add income and set budget targets to start."
                  : allocPct < 50
                  ? "Over half your income is unallocated. Consider setting more targets."
                  : allocPct < 80
                  ? "Good progress! A few more categories could be planned."
                  : allocPct <= 100
                  ? "Your budget is well distributed across categories."
                  : "You've over-allocated your income. Review your targets."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Breakdown Table ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div>
            <h3 className="text-2xl font-[Manrope] font-bold tracking-tight" style={{ color: "var(--v3-text)" }}>
              Category Breakdown
            </h3>
            <p className="text-sm" style={{ color: "var(--v3-text-muted)" }}>
              Edit target or actual values inline
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl overflow-hidden border shadow-sm"
          style={{ backgroundColor: "var(--v3-surface-low)", borderColor: "var(--v3-border)" }}
        >
          {/* Table Header */}
          <div
            className="grid grid-cols-12 px-6 py-4 text-[11px] font-black uppercase tracking-wider border-b"
            style={{ color: "var(--v3-text-muted)", borderColor: "var(--v3-surface-high)" }}
          >
            <div className="col-span-4">Category Name</div>
            <div className="col-span-2 text-right">Target Amount</div>
            <div className="col-span-2 text-right">Actual Spent</div>
            <div className="col-span-3 text-center">Budget Status</div>
            <div className="col-span-1" />
          </div>

          {/* Rows */}
          <div>
            {CATEGORIES.map((cat) => {
              const entry = effectiveBudgets[cat.name] ?? { budget: 0, actual: 0 };
              const isComputed = (computedActuals[cat.name] ?? 0) > 0;
              const pct = entry.budget > 0 ? (entry.actual / entry.budget) * 100 : 0;
              const diff = entry.budget - entry.actual;
              const overBudget = entry.budget > 0 && entry.actual > entry.budget;

              return (
                <div
                  key={cat.name}
                  className="grid grid-cols-12 px-6 py-4 items-center transition-colors group"
                  style={{ backgroundColor: "var(--v3-card)", borderBottom: "1px solid var(--v3-surface-high)" }}
                >
                  {/* Category */}
                  <div className="col-span-4 flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--v3-surface-low)", color: "var(--v3-primary-alt)" }}
                    >
                      <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: "var(--v3-text)" }}>{cat.name}</p>
                      <p className="text-[10px] font-bold uppercase" style={{ color: "var(--v3-outline)" }}>{cat.group}</p>
                    </div>
                  </div>

                  {/* Target */}
                  <div className="col-span-2 text-right">
                    <InlineNumberInput
                      value={entry.budget}
                      onChange={(v) => setBudget(cat.name, v)}
                      className="font-extrabold"
                    />
                  </div>

                  {/* Actual */}
                  <div className="col-span-2 text-right">
                    {isComputed ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1.5">
                        <span className={`text-sm font-bold tabular-nums ${overBudget ? "text-[var(--v3-red)]" : ""}`} style={{ color: overBudget ? undefined : "var(--v3-text)" }}>
                          {formatNOK(entry.actual)}
                        </span>
                        <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--v3-secondary-container)", color: "var(--v3-secondary)" }}>
                          auto
                        </span>
                      </div>
                    ) : (
                      <InlineNumberInput
                        value={entry.actual}
                        onChange={(v) => setActual(cat.name, v)}
                        className={overBudget ? "text-[var(--v3-red)]" : ""}
                      />
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-3 px-6">
                    {entry.budget > 0 ? (
                      <>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--v3-surface-highest)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              backgroundColor: overBudget ? "var(--v3-red)" : pct >= 80 ? "#b5890a" : "var(--v3-green)",
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] font-black uppercase">
                          <span style={{ color: overBudget ? "var(--v3-red)" : "var(--v3-text-muted)" }}>
                            {overBudget ? "Over budget" : pct >= 100 ? "Fully Settled" : `${Math.round(pct)}% Used`}
                          </span>
                          <span style={{ color: overBudget ? "var(--v3-red)" : "var(--v3-green)" }}>
                            {overBudget ? `-${formatNOK(Math.abs(diff))}` : entry.actual >= entry.budget ? "On Track" : `${formatNOK(diff)} left`}
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="text-[10px] font-bold uppercase" style={{ color: "var(--v3-outline)" }}>
                        No target set
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 text-right">
                    <button
                      className="p-2 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                      style={{ color: "var(--v3-outline)" }}
                    >
                      <span className="material-symbols-outlined text-lg">more_vert</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grand Total Footer */}
          <div
            className="grid grid-cols-12 px-6 py-6 items-center"
            style={{ backgroundColor: "var(--v3-surface-high)", borderTop: "2px solid color-mix(in srgb, var(--v3-primary) 20%, transparent)" }}
          >
            <div className="col-span-4 flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--v3-primary)" }}>Grand Total</span>
              <div className="h-[2px] flex-1 rounded" style={{ backgroundColor: "var(--v3-border)" }} />
            </div>
            <div className="col-span-2 text-right px-2">
              <p className="text-[10px] font-bold uppercase mb-1" style={{ color: "var(--v3-outline)" }}>Target</p>
              <p className="font-extrabold text-xl" style={{ color: "var(--v3-primary)" }}>{formatNOK(totals.totalBudget)}</p>
            </div>
            <div className="col-span-2 text-right px-2">
              <p className="text-[10px] font-bold uppercase mb-1" style={{ color: "var(--v3-outline)" }}>Actual</p>
              <p className="font-extrabold text-xl" style={{ color: "var(--v3-text)" }}>{formatNOK(totals.totalActual)}</p>
            </div>
            <div className="col-span-4 text-right pr-4">
              {totals.budgetRemaining >= 0 ? (
                <span
                  className="text-[10px] font-black uppercase px-4 py-2 rounded-full inline-flex items-center gap-1"
                  style={{
                    color: "var(--v3-green)",
                    backgroundColor: "color-mix(in srgb, var(--v3-green-light) 30%, transparent)",
                    boxShadow: "0 0 0 1px color-mix(in srgb, var(--v3-green) 20%, transparent)",
                  }}
                >
                  <span>●</span> Under Budget by {formatNOK(totals.budgetRemaining)}
                </span>
              ) : (
                <span
                  className="text-[10px] font-black uppercase px-4 py-2 rounded-full inline-flex items-center gap-1"
                  style={{
                    color: "var(--v3-red)",
                    backgroundColor: "var(--v3-red-container)",
                    boxShadow: "0 0 0 1px color-mix(in srgb, var(--v3-red) 20%, transparent)",
                  }}
                >
                  <span>●</span> Over Budget by {formatNOK(Math.abs(totals.budgetRemaining))}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Insights Bento Grid ── */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-20 md:pb-8">
        {/* Spending Trends */}
        <div
          className="md:col-span-2 p-6 rounded-2xl shadow-sm border space-y-4"
          style={{ backgroundColor: "var(--v3-card)", borderColor: "var(--v3-surface-high)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-[Manrope] font-bold text-lg" style={{ color: "var(--v3-text)" }}>Spending Trends</h4>
              <p className="text-xs" style={{ color: "var(--v3-text-muted)" }}>Top 5 categories by actual spend</p>
            </div>
            <span className="material-symbols-outlined text-2xl" style={{ color: "var(--v3-primary)" }}>analytics</span>
          </div>

          <div className="space-y-4">
            {trendCategories.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]" style={{ color: "var(--v3-primary-alt)" }}>
                      {cat.icon}
                    </span>
                    <span className="font-medium" style={{ color: "var(--v3-text)" }}>{cat.name}</span>
                  </div>
                  <span className="tabular-nums" style={{ color: "var(--v3-text-muted)" }}>
                    {formatNOK(cat.actual)} / {formatNOK(cat.budget)}
                  </span>
                </div>
                <div className="relative h-6 rounded-lg overflow-hidden" style={{ backgroundColor: "var(--v3-surface-low)" }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg"
                    style={{ width: `${(cat.budget / maxTrend) * 100}%`, backgroundColor: "color-mix(in srgb, var(--v3-border) 40%, transparent)" }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
                    style={{
                      width: `${(cat.actual / maxTrend) * 100}%`,
                      backgroundColor:
                        cat.budget > 0 && cat.actual > cat.budget ? "var(--v3-red)"
                          : cat.budget > 0 && cat.actual >= cat.budget * 0.8 ? "#b5890a"
                          : "var(--v3-green)",
                    }}
                  />
                </div>
              </div>
            ))}
            {trendCategories.every((c) => c.actual === 0 && c.budget === 0) && (
              <div className="text-center py-8 text-sm" style={{ color: "var(--v3-outline)" }}>
                <span className="material-symbols-outlined text-[40px] block mb-2" style={{ color: "var(--v3-border)" }}>
                  show_chart
                </span>
                Add budget targets and actuals to see trends
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-6 pt-4" style={{ borderTop: "1px solid var(--v3-surface-high)" }}>
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--v3-text-muted)" }}>
              <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: "var(--v3-green)" }} /> Actual
            </div>
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--v3-text-muted)" }}>
              <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: "color-mix(in srgb, var(--v3-border) 40%, transparent)" }} /> Target
            </div>
          </div>
        </div>

        {/* Savings Goal */}
        <div
          className="p-6 rounded-2xl shadow-sm border flex flex-col justify-between hover:shadow-md transition-shadow"
          style={{ backgroundColor: "var(--v3-card)", borderColor: "var(--v3-surface-high)" }}
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-2xl" style={{ color: "var(--v3-green)" }}>savings</span>
              {(effectiveBudgets["Savings"]?.budget ?? 0) > 0 && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                  style={{ color: "var(--v3-green)", backgroundColor: "color-mix(in srgb, var(--v3-green-light) 40%, transparent)" }}
                >
                  Active
                </span>
              )}
            </div>
            <h4 className="font-[Manrope] font-bold" style={{ color: "var(--v3-text)" }}>Savings Goal</h4>
            <p className="text-2xl font-[Manrope] font-black mt-1" style={{ color: "var(--v3-primary)" }}>
              {formatNOK(effectiveBudgets["Savings"]?.actual ?? 0)}
            </p>
          </div>
          {(effectiveBudgets["Savings"]?.budget ?? 0) > 0 ? (
            <div className="mt-4">
              <div className="w-full h-1 rounded-full" style={{ backgroundColor: "var(--v3-surface-highest)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((effectiveBudgets["Savings"].actual / effectiveBudgets["Savings"].budget) * 100, 100)}%`,
                    backgroundColor: "var(--v3-green)",
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: "var(--v3-text-muted)" }}>
                  Target: {formatNOK(effectiveBudgets["Savings"].budget)}
                </p>
                <p className="text-[10px] font-bold" style={{ color: "var(--v3-green)" }}>
                  {Math.round((effectiveBudgets["Savings"].actual / effectiveBudgets["Savings"].budget) * 100)}%
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-3" style={{ color: "var(--v3-outline)" }}>
              Set a savings target in the table above.
            </p>
          )}
        </div>

        {/* Upcoming Bills */}
        <div
          className="p-6 rounded-2xl shadow-sm border flex flex-col justify-between hover:shadow-md transition-shadow"
          style={{ backgroundColor: "var(--v3-card)", borderColor: "var(--v3-surface-high)" }}
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-2xl" style={{ color: "var(--v3-secondary)" }}>electric_bolt</span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                style={{ color: "var(--v3-outline)", backgroundColor: "var(--v3-surface-high)" }}
              >
                Fixed Costs
              </span>
            </div>
            <h4 className="font-[Manrope] font-bold" style={{ color: "var(--v3-text)" }}>Fixed Bills</h4>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { label: "Rent & Utilities", icon: "home", amount: effectiveBudgets["Rent & Utilities"]?.budget ?? 0 },
              { label: "Insurance", icon: "shield", amount: effectiveBudgets["Insurance"]?.budget ?? 0 },
              { label: "Subscriptions", icon: "subscriptions", amount: effectiveBudgets["Subscriptions"]?.budget ?? 0 },
            ]
              .filter((b) => b.amount > 0)
              .map((bill) => (
                <div key={bill.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-[16px]" style={{ color: "var(--v3-outline)" }}>
                      {bill.icon}
                    </span>
                    <span style={{ color: "var(--v3-text-muted)" }}>{bill.label}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--v3-text)" }}>
                    {formatNOK(bill.amount)}
                  </span>
                </div>
              ))}
            {[effectiveBudgets["Rent & Utilities"]?.budget, effectiveBudgets["Insurance"]?.budget, effectiveBudgets["Subscriptions"]?.budget].every(
              (v) => !v
            ) && (
              <p className="text-sm" style={{ color: "var(--v3-outline)" }}>
                Set fixed-cost budgets to see bills here.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Dialogs ── */}
      <IncomeDialog
        open={incomeDialogOpen}
        onClose={() => { setIncomeDialogOpen(false); setEditingIncome(null); }}
        onSave={(label, amount) => {
          if (editingIncome) {
            updateIncome(editingIncome.id, { label, amount });
          } else {
            addIncome(label, amount);
          }
        }}
        initial={editingIncome ?? undefined}
      />

      <SaveTemplateDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={saveTemplate}
      />
    </div>
  );
}
