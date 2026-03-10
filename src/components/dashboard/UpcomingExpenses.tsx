"use client";

import { useRecurring } from "@/hooks/useRecurring";
import { formatCurrency, formatDate } from "@/lib/utils";

export function UpcomingExpenses() {
  const { recurring, isLoading } = useRecurring();

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-lg border bg-card" />;
  }

  // Filter active recurring that are expected in the next 7 days
  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const upcoming = recurring
    .filter((r) => {
      if (!r.active) return false;
      const d = new Date(r.next_expected_date);
      return d >= now && d <= weekFromNow;
    })
    .sort(
      (a, b) =>
        new Date(a.next_expected_date).getTime() -
        new Date(b.next_expected_date).getTime(),
    );

  if (upcoming.length === 0) return null;

  const total = upcoming.reduce((s, r) => s + Math.abs(r.expected_amount), 0);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Upcoming Expenses (7 days)</h2>
        <span className="text-sm font-mono text-muted-foreground">
          {formatCurrency(total)}
        </span>
      </div>
      <div className="space-y-1">
        {upcoming.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/30"
          >
            <div>
              <p className="text-sm font-medium capitalize">
                {r.description_pattern}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(r.next_expected_date)} &middot; {r.category}
              </p>
            </div>
            <span className="font-mono text-sm text-red-600">
              {formatCurrency(r.expected_amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
