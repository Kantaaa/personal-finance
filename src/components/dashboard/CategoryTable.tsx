"use client";

import type { MonthData } from "@/hooks/useMonthlyTrend";
import { formatCurrency } from "@/lib/utils";

interface CategoryTableProps {
  data: MonthData[] | undefined;
  isLoading: boolean;
}

export function CategoryTable({ data, isLoading }: CategoryTableProps) {
  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-lg border bg-card" />;
  }

  if (!data || data.length === 0) {
    return null;
  }

  // Collect all categories, sorted by total spend across all months
  const catTotals: Record<string, number> = {};
  for (const m of data) {
    for (const [cat, amt] of Object.entries(m.categories)) {
      catTotals[cat] = (catTotals[cat] ?? 0) + amt;
    }
  }
  const categories = Object.entries(catTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([cat]) => cat);

  if (categories.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 font-semibold">Category Comparison</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="pb-2 pr-3 text-left font-medium">Category</th>
              {data.map((m) => (
                <th
                  key={m.month}
                  className="pb-2 px-2 text-right font-medium whitespace-nowrap"
                >
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat} className="border-b last:border-0">
                <td className="py-1.5 pr-3 font-medium">{cat}</td>
                {data.map((m, mi) => {
                  const amount = m.categories[cat] ?? 0;
                  const prevAmount =
                    mi > 0 ? (data[mi - 1].categories[cat] ?? 0) : null;

                  let changeClass = "text-muted-foreground";
                  if (prevAmount !== null && amount !== prevAmount) {
                    changeClass =
                      amount > prevAmount ? "text-red-500" : "text-green-600";
                  }

                  return (
                    <td
                      key={m.month}
                      className={`py-1.5 px-2 text-right font-mono whitespace-nowrap ${changeClass}`}
                    >
                      {amount > 0 ? formatCurrency(amount) : "\u2014"}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Totals row */}
            <tr className="border-t font-semibold">
              <td className="py-1.5 pr-3">Total</td>
              {data.map((m) => (
                <td
                  key={m.month}
                  className="py-1.5 px-2 text-right font-mono whitespace-nowrap"
                >
                  {formatCurrency(m.totalExpenses)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
