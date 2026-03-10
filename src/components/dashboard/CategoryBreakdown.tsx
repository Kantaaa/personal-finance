"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Summary } from "@/hooks/useSummary";
import { formatCurrency } from "@/lib/utils";

interface CategoryBreakdownProps {
  summary: Summary | undefined;
  isLoading: boolean;
}

const COLORS = [
  "#6366f1", "#f59e0b", "#ef4444", "#22c55e", "#3b82f6",
  "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#64748b",
  "#a855f7", "#06b6d4",
];

export function CategoryBreakdown({
  summary,
  isLoading,
}: CategoryBreakdownProps) {
  if (isLoading) {
    return <div className="h-72 animate-pulse rounded-lg border bg-card" />;
  }

  if (!summary) return null;

  const categories = Object.entries(summary.byCategory)
    .filter(([, amount]) => amount < 0)
    .sort(([, a], [, b]) => a - b);

  if (categories.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border bg-card">
        <p className="text-sm text-muted-foreground">No expense data for this period.</p>
      </div>
    );
  }

  const totalExpenses = categories.reduce((sum, [, amt]) => sum + Math.abs(amt), 0);
  const pieData = categories.map(([name, amount]) => ({
    name,
    value: Math.abs(amount),
  }));

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 font-semibold">Spending by Category</h2>
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Donut chart */}
        <div className="flex-shrink-0 self-center">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                stroke="none"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-card)",
                  fontSize: "13px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend list */}
        <div className="flex-1 space-y-1.5">
          {categories.map(([category, amount], i) => {
            const pct = ((Math.abs(amount) / totalExpenses) * 100).toFixed(0);
            return (
              <div key={category} className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="flex-1 truncate">{category}</span>
                <span className="text-muted-foreground">{pct}%</span>
                <span className="w-24 text-right font-mono text-muted-foreground">
                  {formatCurrency(Math.abs(amount))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
