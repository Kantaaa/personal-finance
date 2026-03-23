"use client";

import { useState, useRef, useEffect } from "react";
import { useV3Store, formatNOK, CATEGORIES, type MonthlySnapshot } from "@/app/v3/lib/store";

/* ── Helpers ───────────────────────────────────────────────── */

function monthLabel(m: string): string {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1);
  return d.toLocaleString("en-US", { month: "short" });
}

function fullMonthLabel(m: string): string {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function yearFromMonth(m: string): string {
  return m.split("-")[0];
}

/* ── Add Vault Note Dialog ─────────────────────────────────── */

function AddNoteDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (author: string, text: string) => void;
}) {
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setAuthor("");
      setText("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (author.trim() && text.trim()) {
      onSave(author.trim(), text.trim());
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
          Add Note to Vault
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--v3-text-muted)" }}>
              Your Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Marcus"
              className="w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all"
              style={{ borderColor: "var(--v3-border)", backgroundColor: "var(--v3-surface-low)", color: "var(--v3-text)" }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--v3-text-muted)" }}>
              Note
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleSubmit(); }}
              rows={3}
              placeholder="Share observations about this month's finances..."
              className="w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all resize-y"
              style={{ borderColor: "var(--v3-border)", backgroundColor: "var(--v3-surface-low)", color: "var(--v3-text)" }}
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
            <span className="material-symbols-outlined text-[18px]">add_comment</span>
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function HistoryPage() {
  const { data, loaded, history, vaultNotes, addVaultNote, deleteVaultNote } = useV3Store();
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());

  if (!loaded) {
    return (
      <div className="p-6 lg:p-10 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[var(--v3-primary-alt)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--v3-text-muted)] font-medium">Loading history...</p>
        </div>
      </div>
    );
  }

  // Combine current month with archived history for display
  const currentTotalIncome = data.incomes.reduce((s, i) => s + i.amount, 0);
  const currentTotalBudget = Object.values(data.budgets).reduce((s, b) => s + b.budget, 0);
  const currentTotalActual = Object.values(data.budgets).reduce((s, b) => s + b.actual, 0);

  const currentSnapshot: MonthlySnapshot = {
    month: data.month,
    incomes: data.incomes,
    totalIncome: currentTotalIncome,
    totalBudget: currentTotalBudget,
    totalActual: currentTotalActual,
    budgets: data.budgets,
    notes: "",
    archivedAt: "",
  };

  // All months: archived + current, sorted newest first
  const allMonths = [currentSnapshot, ...history.filter((h) => h.month !== data.month)]
    .sort((a, b) => b.month.localeCompare(a.month));

  // Get unique years
  const years = [...new Set(allMonths.map((m) => yearFromMonth(m.month)))].sort((a, b) => b.localeCompare(a));

  // Last 3 months for comparison table
  const last3 = allMonths.slice(0, 3);

  // Last 6 months for charts + avg savings rate
  const last6 = allMonths.slice(0, 6).reverse(); // chronological order for charts

  // Average savings rate over last 6 months
  const avgSavingsRate = last6.length > 0
    ? last6.reduce((sum, m) => {
        const rate = m.totalIncome > 0 ? ((m.totalIncome - m.totalActual) / m.totalIncome) * 100 : 0;
        return sum + rate;
      }, 0) / last6.length
    : 0;

  // Max values for bar chart scaling
  const chartMax = Math.max(...last6.map((m) => Math.max(m.totalIncome, m.totalActual)), 1);

  // Trending categories: compare current month to previous
  const prevMonth = allMonths[1]; // second newest
  const trendingCategories = CATEGORIES.map((cat) => {
    const currentActual = currentSnapshot.budgets[cat.name]?.actual ?? 0;
    const prevActual = prevMonth?.budgets[cat.name]?.actual ?? 0;
    const change = prevActual > 0 ? ((currentActual - prevActual) / prevActual) * 100 : 0;
    return { ...cat, currentActual, prevActual, change };
  })
    .filter((c) => c.currentActual > 0 || c.prevActual > 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5);

  // Recent history log entries from archived months
  const logEntries = history.slice(0, 5).map((s) => ({
    month: s.month,
    label: `Monthly period finalized`,
    detail: `${formatNOK(s.totalActual)} spent of ${formatNOK(s.totalIncome)} income`,
    color: s.totalActual <= s.totalIncome ? "var(--v3-green)" : "var(--v3-red)",
  }));

  const hasData = allMonths.some((m) => m.totalIncome > 0 || m.totalActual > 0);

  return (
    <div className="p-6 lg:p-10 space-y-10">
      {/* ── Timeline Selection ── */}
      <section className="flex flex-col md:flex-row gap-6 items-end justify-between">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest font-[Manrope]" style={{ color: "var(--v3-text-muted)" }}>
            Timeline Selection
          </h3>
          <div className="flex flex-wrap gap-2 p-1 rounded-xl" style={{ backgroundColor: "var(--v3-surface-low)" }}>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className="px-5 py-2 rounded-lg text-sm font-bold transition-all"
                style={
                  y === selectedYear
                    ? { backgroundColor: "var(--v3-card)", color: "var(--v3-text)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                    : { color: "var(--v3-outline)" }
                }
              >
                {y}
              </button>
            ))}
            {years.length === 0 && (
              <span className="px-5 py-2 text-sm font-bold" style={{ color: "var(--v3-outline)" }}>
                {new Date().getFullYear()}
              </span>
            )}
          </div>
        </div>

        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex gap-1 p-1 rounded-xl whitespace-nowrap" style={{ backgroundColor: "var(--v3-surface-low)" }}>
            {Array.from({ length: 12 }, (_, i) => {
              const mo = String(i + 1).padStart(2, "0");
              const key = `${selectedYear}-${mo}`;
              const hasMonth = allMonths.some((m) => m.month === key);
              const label = new Date(Number(selectedYear), i).toLocaleString("en-US", { month: "short" }).toUpperCase();
              return (
                <span
                  key={key}
                  className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={
                    hasMonth
                      ? { backgroundColor: "var(--v3-card)", color: "var(--v3-text)", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }
                      : { color: "var(--v3-outline)" }
                  }
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {!hasData ? (
        /* ── Empty State ── */
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-[64px] block mb-4" style={{ color: "var(--v3-border)" }}>
            inventory_2
          </span>
          <h3 className="text-xl font-[Manrope] font-bold mb-2" style={{ color: "var(--v3-text)" }}>
            No Historical Data Yet
          </h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--v3-text-muted)" }}>
            Complete your first monthly review to start building your financial history.
            Go to Monthly Review and click &quot;Finish Review&quot; to archive a month.
          </p>
        </div>
      ) : (
        <>
          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Charts + Table (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Income vs Spending Bar Chart */}
              <div
                className="rounded-2xl p-8 shadow-sm border"
                style={{ backgroundColor: "var(--v3-card)", borderColor: "var(--v3-surface-high)" }}
              >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h4 className="text-xl font-[Manrope] font-bold" style={{ color: "var(--v3-text)" }}>
                      Income vs. Spending
                    </h4>
                    <p className="text-sm" style={{ color: "var(--v3-text-muted)" }}>Year-to-date trajectory</p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--v3-primary)" }} />
                      <span className="text-[10px] font-medium uppercase tracking-tighter" style={{ color: "var(--v3-outline)" }}>Income</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--v3-secondary-container)" }} />
                      <span className="text-[10px] font-medium uppercase tracking-tighter" style={{ color: "var(--v3-outline)" }}>Spending</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--v3-green)" }} />
                      <span className="text-[10px] font-medium uppercase tracking-tighter" style={{ color: "var(--v3-outline)" }}>Net</span>
                    </div>
                  </div>
                </div>

                {/* Bar chart */}
                <div className="flex items-end justify-between h-48 gap-3 px-2">
                  {last6.map((m) => {
                    const incomeH = (m.totalIncome / chartMax) * 100;
                    const spendH = (m.totalActual / chartMax) * 100;
                    const net = m.totalIncome - m.totalActual;
                    const netH = Math.max((Math.abs(net) / chartMax) * 100, 4);
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center justify-end gap-1 group">
                        <div className="w-full flex gap-1 items-end justify-center" style={{ height: "100%" }}>
                          {/* Spending bar */}
                          <div
                            className="flex-1 rounded-t transition-all group-hover:opacity-80"
                            style={{ height: `${spendH}%`, backgroundColor: "var(--v3-secondary-container)" }}
                            title={`Spending: ${formatNOK(m.totalActual)}`}
                          />
                          {/* Income bar */}
                          <div
                            className="flex-1 rounded-t transition-all group-hover:opacity-80"
                            style={{ height: `${incomeH}%`, backgroundColor: "var(--v3-primary)" }}
                            title={`Income: ${formatNOK(m.totalIncome)}`}
                          />
                          {/* Net savings bar */}
                          <div
                            className="flex-1 rounded-t transition-all group-hover:opacity-80"
                            style={{
                              height: `${netH}%`,
                              backgroundColor: net >= 0 ? "var(--v3-green)" : "var(--v3-red)",
                            }}
                            title={`Net: ${formatNOK(net)}`}
                          />
                        </div>
                        <span className="text-[10px] text-center font-bold uppercase mt-2" style={{ color: "var(--v3-outline)" }}>
                          {monthLabel(m.month)}
                        </span>
                      </div>
                    );
                  })}
                  {last6.length === 0 && (
                    <p className="text-sm w-full text-center py-16" style={{ color: "var(--v3-outline)" }}>
                      Not enough data for chart
                    </p>
                  )}
                </div>
              </div>

              {/* Historical Comparison Table */}
              <div
                className="rounded-2xl overflow-hidden p-8 border"
                style={{ backgroundColor: "var(--v3-surface-low)", borderColor: "var(--v3-surface-high)" }}
              >
                <h4 className="text-xl font-[Manrope] font-bold mb-6" style={{ color: "var(--v3-text)" }}>
                  Historical Comparison
                </h4>
                {last3.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--v3-text-muted)" }}>
                          <th className="pb-4">Metric</th>
                          {last3.map((m, i) => (
                            <th
                              key={m.month}
                              className="pb-4 px-4 text-center"
                              style={i === 0 ? { backgroundColor: "color-mix(in srgb, var(--v3-card) 50%, transparent)", borderRadius: "0.5rem 0.5rem 0 0" } : undefined}
                            >
                              {fullMonthLabel(m.month)}
                              {m.month === data.month && (
                                <span className="ml-1.5 text-[8px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--v3-primary)", color: "white" }}>NOW</span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-sm font-medium">
                        {[
                          { label: "Total Income", key: "totalIncome" as const, highlight: true },
                          { label: "Total Spending", key: "totalActual" as const, highlight: false },
                          { label: "Surplus", key: null, highlight: true },
                          { label: "Savings Rate", key: null, highlight: false },
                        ].map((row) => (
                          <tr key={row.label} style={{ borderBottom: "1px solid var(--v3-surface-high)" }}>
                            <td className="py-4" style={{ color: "var(--v3-outline)" }}>{row.label}</td>
                            {last3.map((m, i) => {
                              let value: string;
                              let color = "var(--v3-text)";
                              if (row.label === "Surplus") {
                                const surplus = m.totalIncome - m.totalActual;
                                value = `${surplus >= 0 ? "+" : ""}${formatNOK(surplus)}`;
                                color = surplus >= 0 ? "var(--v3-green)" : "var(--v3-red)";
                              } else if (row.label === "Savings Rate") {
                                const rate = m.totalIncome > 0 ? ((m.totalIncome - m.totalActual) / m.totalIncome) * 100 : 0;
                                value = `${rate.toFixed(1)}%`;
                              } else {
                                value = formatNOK(m[row.key!]);
                                if (row.highlight && i === 0) color = "var(--v3-primary)";
                              }
                              return (
                                <td
                                  key={m.month}
                                  className="py-4 text-center"
                                  style={{
                                    color,
                                    fontWeight: i === 0 ? 700 : 500,
                                    backgroundColor: i === 0 ? "color-mix(in srgb, var(--v3-card) 50%, transparent)" : undefined,
                                  }}
                                >
                                  {value}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: "var(--v3-outline)" }}>Need at least one month of data.</p>
                )}
              </div>

              {/* Category-by-Category 6-Month History */}
              {last6.length >= 2 && (
                <div
                  className="rounded-2xl overflow-hidden p-8 border"
                  style={{ backgroundColor: "var(--v3-card)", borderColor: "var(--v3-surface-high)" }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="text-xl font-[Manrope] font-bold" style={{ color: "var(--v3-text)" }}>
                        Category History
                      </h4>
                      <p className="text-sm" style={{ color: "var(--v3-text-muted)" }}>
                        Track every category over the last {last6.length} months
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--v3-text-muted)" }}>
                          <th className="pb-3 pr-4">Category</th>
                          {last6.map((m) => (
                            <th key={m.month} className="pb-3 px-3 text-right">{monthLabel(m.month)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {CATEGORIES.map((cat) => {
                          const vals = last6.map((m) => m.budgets[cat.name]?.actual ?? 0);
                          const hasAny = vals.some((v) => v > 0);
                          if (!hasAny) return null;
                          return (
                            <tr key={cat.name} style={{ borderBottom: "1px solid var(--v3-surface-high)" }}>
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[16px]" style={{ color: "var(--v3-primary-alt)" }}>
                                    {cat.icon}
                                  </span>
                                  <span className="font-medium" style={{ color: "var(--v3-text)" }}>{cat.name}</span>
                                </div>
                              </td>
                              {vals.map((v, i) => (
                                <td key={i} className="py-3 px-3 text-right tabular-nums font-medium" style={{ color: v > 0 ? "var(--v3-text)" : "var(--v3-outline)" }}>
                                  {v > 0 ? formatNOK(v) : "-"}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Side Panels (4 cols) */}
            <div className="lg:col-span-4 space-y-8">
              {/* Trending Categories */}
              <div
                className="rounded-2xl p-8 shadow-sm border"
                style={{ backgroundColor: "var(--v3-card)", borderColor: "var(--v3-surface-high)" }}
              >
                <h4 className="text-lg font-[Manrope] font-bold mb-6" style={{ color: "var(--v3-text)" }}>
                  Trending Categories
                </h4>
                <div className="space-y-5">
                  {trendingCategories.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--v3-outline)" }}>
                      Need at least two months of data to show trends.
                    </p>
                  ) : (
                    trendingCategories.map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: "var(--v3-surface-high)", color: "var(--v3-primary)" }}
                          >
                            <span className="material-symbols-outlined">{cat.icon}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold" style={{ color: "var(--v3-text)" }}>{cat.name}</p>
                            <p className="text-xs" style={{ color: "var(--v3-outline)" }}>Trend vs Prev Month</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className="text-sm font-bold flex items-center gap-1"
                            style={{
                              color: cat.change > 5
                                ? "var(--v3-red)"
                                : cat.change < -5
                                ? "var(--v3-green)"
                                : "var(--v3-outline)",
                            }}
                          >
                            <span className="material-symbols-outlined text-xs">
                              {cat.change > 5 ? "trending_up" : cat.change < -5 ? "trending_down" : "horizontal_rule"}
                            </span>
                            {Math.abs(Math.round(cat.change))}%
                          </span>
                          <p className="text-xs font-medium" style={{ color: "var(--v3-outline)" }}>
                            {formatNOK(cat.currentActual)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Collaborative Vault */}
              <div className="premium-gradient text-white rounded-2xl p-8 shadow-lg relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-10">
                  <span className="material-symbols-outlined text-[120px]">auto_awesome</span>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-[Manrope] font-bold">Collaborative Vault</h4>
                    <button
                      onClick={() => setNoteDialogOpen(true)}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                      title="Add note"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {vaultNotes.length === 0 ? (
                      <div className="bg-white/10 p-4 rounded-lg backdrop-blur-md">
                        <p className="text-sm text-white/80 italic">
                          No notes yet. Add observations or plans to share with your partner.
                        </p>
                      </div>
                    ) : (
                      vaultNotes.slice(0, 5).map((note) => (
                        <div key={note.id} className="bg-white/10 p-4 rounded-lg backdrop-blur-md group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/30 bg-white/20">
                                {note.author[0]?.toUpperCase()}
                              </div>
                              <p className="text-xs font-bold opacity-80">
                                {note.author} — {new Date(note.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteVaultNote(note.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/20"
                              title="Delete note"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                          <p className="text-sm leading-relaxed text-white/90 italic">&quot;{note.text}&quot;</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Average Savings Rate Ring */}
              <div
                className="rounded-2xl p-8 flex flex-col items-center justify-center text-center border"
                style={{ backgroundColor: "var(--v3-surface-high)", borderColor: "var(--v3-border)" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--v3-text-muted)" }}>
                  Avg. Savings Rate ({Math.min(last6.length, 6)}mo)
                </p>
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                    <circle
                      cx="64" cy="64" r="58"
                      fill="none"
                      stroke="var(--v3-surface-highest)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="64" cy="64" r="58"
                      fill="none"
                      stroke="var(--v3-green)"
                      strokeWidth="8"
                      strokeDasharray={`${364.4 * Math.min(Math.max(avgSavingsRate, 0), 100) / 100} 364.4`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-[Manrope] font-black" style={{ color: "var(--v3-text)" }}>
                      {avgSavingsRate.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: "var(--v3-green)" }}>
                      {avgSavingsRate > 0 ? "Positive" : "No savings"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Recent History Log ── */}
          {logEntries.length > 0 && (
            <section className="space-y-6 pb-20 md:pb-8">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-semibold uppercase tracking-widest font-[Manrope]" style={{ color: "var(--v3-text-muted)" }}>
                  Recent History Log
                </h4>
              </div>
              <div className="space-y-4">
                {logEntries.map((entry) => (
                  <div
                    key={entry.month}
                    className="p-5 rounded-xl shadow-sm flex items-center justify-between"
                    style={{ backgroundColor: "var(--v3-card)", borderLeft: `4px solid ${entry.color}` }}
                  >
                    <div className="flex items-center gap-6">
                      <div className="text-center w-12">
                        <p className="text-[10px] font-black uppercase" style={{ color: "var(--v3-outline)" }}>
                          {monthLabel(entry.month)}
                        </p>
                        <p className="text-lg font-bold" style={{ color: "var(--v3-text)" }}>
                          {yearFromMonth(entry.month)}
                        </p>
                      </div>
                      <div>
                        <h5 className="font-bold text-sm" style={{ color: "var(--v3-text)" }}>{entry.label}</h5>
                        <p className="text-xs" style={{ color: "var(--v3-outline)" }}>{entry.detail}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined" style={{ color: "var(--v3-border)" }}>chevron_right</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Vault Note Dialog ── */}
      <AddNoteDialog
        open={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        onSave={addVaultNote}
      />
    </div>
  );
}
