"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type TooltipProps,
} from "recharts";
import type { MonthData } from "@/hooks/useMonthlyTrend";
import { formatCurrency } from "@/lib/utils";

const COLORS = [
  "#6366f1", "#f59e0b", "#ef4444", "#22c55e", "#3b82f6",
  "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#64748b",
];
const OTHER_COLOR = "#94a3b8";
const MAX_CATEGORIES = 5;

interface MonthlyTrendProps {
  data: MonthData[] | undefined;
  isLoading: boolean;
}

function buildDisplayData(data: MonthData[]) {
  // Find top N categories by total spend across all months
  const totals: Record<string, number> = {};
  for (const m of data) {
    for (const [cat, amt] of Object.entries(m.categories)) {
      totals[cat] = (totals[cat] ?? 0) + amt;
    }
  }
  const sorted = Object.entries(totals).sort(([, a], [, b]) => b - a);
  const topCategories = sorted.slice(0, MAX_CATEGORIES).map(([cat]) => cat);
  const hasOther = sorted.length > MAX_CATEGORIES;
  const otherLabel = topCategories.includes("Other") ? "Other (rest)" : "Other";
  const displayCategories = hasOther
    ? [...topCategories, otherLabel]
    : topCategories;

  // Build chart rows
  const chartData = data.map((m) => {
    const row: Record<string, string | number> = { label: m.label };
    let otherTotal = 0;

    for (const [cat, amt] of Object.entries(m.categories)) {
      if (topCategories.includes(cat)) {
        row[cat] = amt;
      } else {
        otherTotal += amt;
      }
    }
    // Ensure all top categories have a value
    for (const cat of topCategories) {
      if (!(cat in row)) row[cat] = 0;
    }
    if (hasOther) row[otherLabel] = otherTotal;
    row["_total"] = m.totalExpenses;
    return row;
  });

  return { chartData, displayCategories, hasOther, otherLabel };
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  // Get total from the data row
  const total =
    (payload[0]?.payload as Record<string, number>)?._total ?? 0;

  // Filter out zero values and sort by amount descending
  const items = payload
    .filter((p) => (p.value ?? 0) > 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="flex-1">{item.name}</span>
            <span className="font-mono text-muted-foreground">
              {formatCurrency(item.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 border-t pt-1.5 text-xs font-semibold flex justify-between">
        <span>Total</span>
        <span className="font-mono">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

function TotalLabel(props: Record<string, unknown>) {
  const { x, y, width, value } = props as {
    x: number;
    y: number;
    width: number;
    value: number;
  };
  if (!value) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      textAnchor="middle"
      fontSize={11}
      fontWeight={600}
      fill="var(--color-muted-foreground)"
    >
      {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value))}
    </text>
  );
}

export function MonthlyTrend({ data, isLoading }: MonthlyTrendProps) {
  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-lg border bg-card" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border bg-card">
        <p className="text-sm text-muted-foreground">No data yet.</p>
      </div>
    );
  }

  const { chartData, displayCategories, otherLabel } = buildDisplayData(data);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Monthly Spending</h2>
        <p className="text-xs text-muted-foreground">Last 6 months</p>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} barCategoryGap="25%">
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fontWeight: 500 }}
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
            width={45}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
          />
          {displayCategories.map((cat, i) => {
            const isLast = i === displayCategories.length - 1;
            const color =
              cat === otherLabel
                ? OTHER_COLOR
                : COLORS[i % COLORS.length];
            return (
              <Bar
                key={cat}
                dataKey={cat}
                stackId="spending"
                fill={color}
                radius={isLast ? [4, 4, 0, 0] : undefined}
                label={isLast ? <TotalLabel /> : undefined}
              >
                {chartData.map((_, j) => (
                  <Cell key={j} fill={color} />
                ))}
              </Bar>
            );
          })}
        </BarChart>
      </ResponsiveContainer>

      {/* Compact legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3">
        {displayCategories.map((cat, i) => (
          <div key={cat} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor:
                  cat === "Other"
                    ? OTHER_COLOR
                    : COLORS[i % COLORS.length],
              }}
            />
            <span className="text-muted-foreground">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
