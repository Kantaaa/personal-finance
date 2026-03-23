"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useV3Store, formatNOK, CATEGORIES,
  computeTrends, detectRecurring, getTopMerchants, getDailySpending, findUnusualSpending,
} from "@/app/v3/lib/store";

const CATEGORY_COLORS = [
  "#005050", "#006a6a", "#005315", "#2a7a5b", "#3e8e7e",
  "#4a9e8e", "#5bae9e", "#6cc0ae", "#7dd2be", "#8ee4ce",
];

/* ── Spending Velocity SVG Chart ───────────────────────────── */
function SpendingVelocityChart({
  dailyData,
  budgetTarget,
  month,
}: {
  dailyData: { date: string; cumulative: number }[];
  budgetTarget: number;
  month: string;
}) {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const maxY = Math.max(budgetTarget, ...dailyData.map((d) => d.cumulative), 1) * 1.1;

  const W = 580, H = 180, PX = 10, PY = 10;

  // Actual spending polyline
  const actualPoints = dailyData.map((d) => {
    const day = parseInt(d.date.split("-")[2], 10);
    const x = PX + (day / daysInMonth) * W;
    const yPos = H + PY - (d.cumulative / maxY) * H;
    return `${x},${yPos}`;
  });

  // Baseline (linear from 0 to budget target)
  const baseStart = `${PX},${H + PY}`;
  const baseEnd = `${PX + W},${H + PY - (budgetTarget / maxY) * H}`;

  // Current day marker
  const today = new Date();
  const currentDay = today.getFullYear() === y && today.getMonth() + 1 === m ? today.getDate() : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W + PX * 2} ${H + PY * 2}`} className="w-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pct) => (
          <line key={pct} x1={PX} x2={PX + W} y1={H + PY - pct * H} y2={H + PY - pct * H}
            stroke="var(--v3-surface-highest)" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        {/* Baseline */}
        <line x1={PX} y1={H + PY} x2={PX + W} y2={H + PY - (budgetTarget / maxY) * H}
          stroke="var(--v3-border)" strokeWidth="2" strokeDasharray="6 4" />
        {/* Actual spending area */}
        {actualPoints.length > 0 && (
          <>
            <polygon
              points={`${PX},${H + PY} ${actualPoints.join(" ")} ${actualPoints[actualPoints.length - 1].split(",")[0]},${H + PY}`}
              fill="var(--v3-primary)" fillOpacity="0.08"
            />
            <polyline points={actualPoints.join(" ")} fill="none" stroke="var(--v3-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {/* Current day marker */}
        {currentDay && actualPoints.length > 0 && (
          <circle
            cx={parseFloat(actualPoints[actualPoints.length - 1].split(",")[0])}
            cy={parseFloat(actualPoints[actualPoints.length - 1].split(",")[1])}
            r="5" fill="var(--v3-primary)" stroke="var(--v3-card)" strokeWidth="2"
          />
        )}
      </svg>
      {/* X-axis labels */}
      <div className="flex justify-between px-3 text-[10px] font-medium" style={{ color: "var(--v3-outline)" }}>
        <span>1</span>
        <span>{Math.round(daysInMonth * 0.25)}</span>
        <span>{Math.round(daysInMonth * 0.5)}</span>
        <span>{Math.round(daysInMonth * 0.75)}</span>
        <span>{daysInMonth}</span>
      </div>
    </div>
  );
}

/* ── Main Dashboard ────────────────────────────────────────── */
export default function V3DashboardPage() {
  const { data, loaded, totals, effectiveBudgets, history, setIncome } = useV3Store();
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState("");

  // Computed insights
  const trends = useMemo(
    () => computeTrends(data.income, totals.totalActual, history),
    [data.income, totals.totalActual, history]
  );

  const unusual = useMemo(
    () => findUnusualSpending(effectiveBudgets, history),
    [effectiveBudgets, history]
  );

  const recurring = useMemo(
    () => detectRecurring(data.transactions, history),
    [data.transactions, history]
  );

  const topMerchants = useMemo(
    () => getTopMerchants(data.transactions, data.month, 5),
    [data.transactions, data.month]
  );

  const dailySpending = useMemo(
    () => getDailySpending(data.transactions, data.month),
    [data.transactions, data.month]
  );

  if (!loaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--v3-primary)] border-t-transparent" />
      </div>
    );
  }

  const savingsRate = data.income > 0 ? ((data.income - totals.totalActual) / data.income) * 100 : 0;
  const recentTransactions = data.transactions.slice(0, 8);

  // Welcome state
  if (data.income === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="premium-gradient rounded-xl p-10 text-white text-center space-y-6">
          <span className="material-symbols-outlined text-5xl opacity-80">waving_hand</span>
          <h1 className="font-[Manrope] text-3xl font-extrabold">Welcome to Your Budget Planner</h1>
          <p className="text-white/80 max-w-md mx-auto">
            Get started by setting your monthly income and configuring your budget categories.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <button onClick={() => { setIncomeInput(""); setEditingIncome(true); }}
              className="bg-white text-[var(--v3-primary)] font-[Manrope] font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors">
              Set Income
            </button>
            <Link href="/v3/budget" className="border border-white/40 text-white font-[Manrope] font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
              Set Budgets
            </Link>
          </div>
          {editingIncome && (
            <form onSubmit={(e) => { e.preventDefault(); setIncome(Math.max(0, parseFloat(incomeInput) || 0)); setEditingIncome(false); }}
              className="flex items-center justify-center gap-3 pt-2">
              <input autoFocus type="number" step="100" min="0" value={incomeInput} onChange={(e) => setIncomeInput(e.target.value)} placeholder="e.g. 45000"
                className="w-44 rounded-xl bg-white/20 border border-white/30 px-4 py-2.5 text-white placeholder-white/50 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-white/40" />
              <button type="submit" className="bg-white text-[var(--v3-primary)] font-bold px-5 py-2.5 rounded-xl">Save</button>
              <button type="button" onClick={() => setEditingIncome(false)} className="text-white/70 hover:text-white px-3 py-2.5">Cancel</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Category breakdown for donut
  const categoryData = CATEGORIES.map((cat, i) => ({
    name: cat.name, icon: cat.icon,
    actual: effectiveBudgets[cat.name]?.actual ?? 0,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  })).filter((c) => c.actual > 0);
  const totalForDonut = categoryData.reduce((s, c) => s + c.actual, 0);
  const circumference = 2 * Math.PI * 40;
  const donutSegments: { offset: number; length: number; color: string }[] = [];
  let cumulativeOffset = 0;
  for (const cat of categoryData) {
    const length = (totalForDonut > 0 ? cat.actual / totalForDonut : 0) * circumference;
    donutSegments.push({ offset: cumulativeOffset, length, color: cat.color });
    cumulativeOffset += length;
  }

  function TrendBadge({ value, suffix = "%" }: { value: number; suffix?: string }) {
    const isPositive = value > 0;
    const isNegative = value < 0;
    return (
      <div className="flex items-center gap-1 text-xs font-semibold mt-2" style={{ color: isNegative ? "var(--v3-green)" : isPositive ? "var(--v3-red)" : "var(--v3-outline)" }}>
        {value !== 0 && <span className="material-symbols-outlined text-sm">{isPositive ? "trending_up" : "trending_down"}</span>}
        {value !== 0 ? `${isPositive ? "+" : ""}${value.toFixed(1)}${suffix}` : "No change"} vs last month
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-[Manrope] font-extrabold tracking-tight" style={{ color: "var(--v3-text)" }}>Financial Insights</h1>
          <p className="mt-1" style={{ color: "var(--v3-text-muted)" }}>
            {savingsRate > 0
              ? `Your savings rate is ${savingsRate.toFixed(0)}% this month.`
              : "Start importing transactions to see insights."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            style={{ backgroundColor: "var(--v3-surface-low)", color: "var(--v3-text)" }}>
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            {data.month}
          </span>
          <Link href="/v3/budget"
            className="px-4 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, var(--v3-gradient-from), var(--v3-gradient-to))" }}>
            <span className="material-symbols-outlined text-lg">tune</span>
            Budgets
          </Link>
        </div>
      </header>

      {/* Row 1: Stats + Unusual Spending */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* Stat cards */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Income */}
          <div className="p-6 rounded-xl shadow-sm" style={{ backgroundColor: "var(--v3-card)", border: "1px solid var(--v3-surface-high)" }}>
            <p className="text-sm mb-1" style={{ color: "var(--v3-text-muted)" }}>Total Income</p>
            <p className="text-2xl font-[Manrope] font-bold" style={{ color: "var(--v3-text)" }}>{formatNOK(data.income)}</p>
            <TrendBadge value={trends.incomeChange} />
          </div>
          {/* Total Expenses */}
          <div className="p-6 rounded-xl shadow-sm" style={{ backgroundColor: "var(--v3-card)", border: "1px solid var(--v3-surface-high)" }}>
            <p className="text-sm mb-1" style={{ color: "var(--v3-text-muted)" }}>Total Expenses</p>
            <p className="text-2xl font-[Manrope] font-bold" style={{ color: "var(--v3-text)" }}>{formatNOK(totals.totalActual)}</p>
            <TrendBadge value={trends.expenseChange} />
          </div>
          {/* Savings Rate */}
          <div className="p-6 rounded-xl shadow-sm" style={{ backgroundColor: "var(--v3-card)", border: "1px solid var(--v3-surface-high)" }}>
            <p className="text-sm mb-1" style={{ color: "var(--v3-text-muted)" }}>Savings Rate</p>
            <p className="text-2xl font-[Manrope] font-bold" style={{ color: "var(--v3-text)" }}>{savingsRate.toFixed(1)}%</p>
            <div className="mt-3 w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--v3-surface-highest)" }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%`, backgroundColor: "var(--v3-green)" }} />
            </div>
          </div>
        </div>

        {/* Unusual Spending Alert */}
        <div className="lg:col-span-4 p-6 rounded-xl relative overflow-hidden group hover:shadow-md transition-shadow"
          style={unusual
            ? { backgroundColor: "color-mix(in srgb, var(--v3-red-container) 20%, transparent)", border: "1px solid color-mix(in srgb, var(--v3-red) 10%, transparent)" }
            : { backgroundColor: "color-mix(in srgb, var(--v3-green-light) 15%, transparent)", border: "1px solid color-mix(in srgb, var(--v3-green) 10%, transparent)" }
          }>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: unusual ? "color-mix(in srgb, var(--v3-red) 10%, transparent)" : "color-mix(in srgb, var(--v3-green) 10%, transparent)", color: unusual ? "var(--v3-red)" : "var(--v3-green)" }}>
                <span className="material-symbols-outlined">{unusual ? "warning" : "check_circle"}</span>
              </div>
              <p className="font-[Manrope] font-bold" style={{ color: unusual ? "var(--v3-red)" : "var(--v3-green)" }}>
                {unusual ? "Unusual Spending" : "Looking Good"}
              </p>
            </div>
            {unusual ? (
              <>
                <p className="font-semibold mb-1" style={{ color: "var(--v3-text)" }}>{unusual.category} Spike</p>
                <p className="text-sm" style={{ color: "var(--v3-text-muted)" }}>
                  <span className="font-bold" style={{ color: "var(--v3-red)" }}>+{unusual.spikePct.toFixed(0)}%</span> more than your {history.length}-month average of {formatNOK(unusual.averageAmount)}.
                </p>
              </>
            ) : (
              <p className="text-sm" style={{ color: "var(--v3-text-muted)" }}>
                No unusual spending spikes detected. Your categories are within normal range.
              </p>
            )}
          </div>
          {unusual && (
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[80px] opacity-5 group-hover:opacity-10 transition-opacity">{unusual.icon}</span>
          )}
        </div>
      </div>

      {/* Row 2: Spending Velocity + Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spending Velocity Chart */}
        <div className="lg:col-span-8 p-6 rounded-xl shadow-sm" style={{ backgroundColor: "var(--v3-card)", border: "1px solid var(--v3-surface-high)" }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[Manrope] font-bold text-lg" style={{ color: "var(--v3-text)" }}>Spending Velocity</h3>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--v3-primary)" }} /> Current
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--v3-border)" }} /> Target
              </div>
            </div>
          </div>
          {dailySpending.length > 0 ? (
            <SpendingVelocityChart dailyData={dailySpending} budgetTarget={totals.totalBudget} month={data.month} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: "var(--v3-outline)" }}>
              <span className="material-symbols-outlined text-4xl mb-2 opacity-40">show_chart</span>
              <p className="text-sm">Approve transactions to see spending velocity</p>
            </div>
          )}
        </div>

        {/* Side Panels */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Recurring Subscriptions */}
          <div className="p-6 rounded-xl flex-1" style={{ backgroundColor: "var(--v3-surface-low)" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined" style={{ color: "var(--v3-primary)" }}>autorenew</span>
              <h3 className="font-[Manrope] font-bold" style={{ color: "var(--v3-text)" }}>Recurring Detected</h3>
            </div>
            {recurring.length > 0 ? (
              <div className="space-y-3">
                {recurring.slice(0, 5).map((item) => {
                  const cat = CATEGORIES.find((c) => c.name === item.category);
                  return (
                    <div key={item.description} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: "var(--v3-card)" }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--v3-surface-high)" }}>
                          <span className="material-symbols-outlined text-sm" style={{ color: "var(--v3-primary)" }}>{cat?.icon ?? "receipt"}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--v3-text)" }}>{item.description}</p>
                          <p className="text-[10px]" style={{ color: "var(--v3-outline)" }}>Monthly &bull; {item.category}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold shrink-0 ml-2" style={{ color: "var(--v3-text)" }}>{formatNOK(item.amount)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--v3-outline)" }}>Import transactions to detect recurring charges.</p>
            )}
          </div>

          {/* Top Merchants */}
          <div className="p-6 rounded-xl flex-1" style={{ backgroundColor: "var(--v3-surface-low)" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined" style={{ color: "var(--v3-primary)" }}>storefront</span>
              <h3 className="font-[Manrope] font-bold" style={{ color: "var(--v3-text)" }}>Top Merchants</h3>
            </div>
            {topMerchants.length > 0 ? (
              <div className="space-y-3">
                {topMerchants.map((m) => {
                  const maxSpend = topMerchants[0]?.total ?? 1;
                  return (
                    <div key={m.description} className="flex items-center gap-3">
                      <span className="text-sm truncate flex-1 min-w-0" style={{ color: "var(--v3-text-muted)" }}>{m.description}</span>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="h-2 flex-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--v3-surface-highest)" }}>
                          <div className="h-full rounded-full" style={{ width: `${(m.total / maxSpend) * 100}%`, backgroundColor: "var(--v3-primary)" }} />
                        </div>
                        <span className="text-sm font-bold w-16 text-right tabular-nums" style={{ color: "var(--v3-text)" }}>{formatNOK(m.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--v3-outline)" }}>No spending data for this month yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Category Breakdown + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown with Donut */}
        <div className="p-6 rounded-xl shadow-sm" style={{ backgroundColor: "var(--v3-card)", border: "1px solid var(--v3-surface-high)" }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[Manrope] font-bold text-lg" style={{ color: "var(--v3-text)" }}>Category Breakdown</h3>
            <span className="material-symbols-outlined" style={{ color: "var(--v3-text-muted)" }}>donut_large</span>
          </div>
          {totalForDonut === 0 ? (
            <div className="text-center py-12" style={{ color: "var(--v3-outline)" }}>
              <span className="material-symbols-outlined text-4xl opacity-40 mb-3 block">category</span>
              <p className="text-sm">No spending recorded yet.</p>
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <div className="relative flex-shrink-0">
                <svg width="140" height="140" viewBox="0 0 100 100" className="-rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--v3-surface-high)" strokeWidth="12" />
                  {donutSegments.map((seg, i) => (
                    <circle key={i} cx="50" cy="50" r="40" fill="none" stroke={seg.color} strokeWidth="12"
                      strokeDasharray={`${seg.length} ${circumference - seg.length}`} strokeDashoffset={-seg.offset} />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-[Manrope] text-base font-extrabold" style={{ color: "var(--v3-text)" }}>{formatNOK(totalForDonut)}</span>
                  <span className="text-[10px]" style={{ color: "var(--v3-text-muted)" }}>Total</span>
                </div>
              </div>
              <div className="flex-grow space-y-2 max-h-[140px] overflow-y-auto">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <div className="flex-grow min-w-0 flex items-center justify-between">
                      <span className="text-xs font-medium truncate" style={{ color: "var(--v3-text)" }}>{cat.name}</span>
                      <span className="text-xs ml-2 shrink-0 tabular-nums" style={{ color: "var(--v3-text-muted)" }}>{formatNOK(cat.actual)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="p-6 rounded-xl shadow-sm" style={{ backgroundColor: "var(--v3-card)", border: "1px solid var(--v3-surface-high)" }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[Manrope] font-bold text-lg" style={{ color: "var(--v3-text)" }}>Recent Activity</h3>
            <Link href="/v3/transactions" className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--v3-primary)" }}>
              View All <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Link>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-12" style={{ color: "var(--v3-outline)" }}>
              <span className="material-symbols-outlined text-4xl opacity-40 mb-3 block">receipt_long</span>
              <p className="text-sm">No transactions yet.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentTransactions.map((tx) => {
                const cat = CATEGORIES.find((c) => c.name === tx.category);
                return (
                  <div key={tx.id} className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: "var(--v3-surface-high)" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--v3-surface-low)" }}>
                      <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--v3-primary)" }}>{cat?.icon ?? "receipt"}</span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--v3-text)" }}>{tx.description}</p>
                      <p className="text-[11px]" style={{ color: "var(--v3-text-muted)" }}>{tx.category} &bull; {tx.date}</p>
                    </div>
                    <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: tx.amount < 0 ? "var(--v3-red)" : "var(--v3-green)" }}>
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
