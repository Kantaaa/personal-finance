"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Summary } from "@/hooks/useSummary";
import { formatCurrency } from "@/lib/utils";

interface SpendingChartProps {
  summary: Summary | undefined;
  isLoading: boolean;
}

export function SpendingChart({ summary, isLoading }: SpendingChartProps) {
  if (isLoading) {
    return <div className="h-72 animate-pulse rounded-lg border bg-card" />;
  }

  if (!summary || summary.dailyTotals.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border bg-card">
        <p className="text-sm text-muted-foreground">No data for this period.</p>
      </div>
    );
  }

  const data = summary.dailyTotals.map((d) => ({
    date: d.date.slice(5), // MM-DD
    Expenses: d.expenses,
  }));

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 font-semibold">Daily Spending</h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
            width={40}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), "Expenses"]}
            labelFormatter={(label: string) => `Date: ${label}`}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-card)",
              fontSize: "13px",
            }}
          />
          <Bar dataKey="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
