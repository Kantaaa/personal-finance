"use client";

import Link from "next/link";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency, formatDate } from "@/lib/utils";

export function RecentTransactions() {
  const { data: transactions, isLoading } = useTransactions({});

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 font-semibold">Recent Transactions</h2>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const recent = (transactions ?? []).slice(0, 7);

  if (recent.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 font-semibold">Recent Transactions</h2>
        <p className="text-sm text-muted-foreground">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Recent Transactions</h2>
        <Link
          href="/transactions"
          className="text-xs font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="space-y-1">
        {recent.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/30"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {t.merchant || t.description || "\u2014"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(t.date)} &middot; {t.category}
              </p>
            </div>
            <span
              className={`ml-3 whitespace-nowrap font-mono text-sm font-medium ${
                t.amount >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {t.amount >= 0 ? "+" : ""}
              {formatCurrency(t.amount, t.currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
