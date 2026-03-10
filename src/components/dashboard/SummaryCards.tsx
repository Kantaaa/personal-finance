"use client";

import type { Summary } from "@/hooks/useSummary";
import { formatCurrency } from "@/lib/utils";

interface SummaryCardsProps {
  summary: Summary | undefined;
  isLoading: boolean;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function ChangeIndicator({ current, previous, invertColor }: { current: number; previous: number; invertColor?: boolean }) {
  const pct = pctChange(Math.abs(current), Math.abs(previous));
  if (pct === null) return null;

  const isUp = pct > 0;
  // For expenses, "up" is bad (red), for income/net "up" is good (green)
  const isPositive = invertColor ? !isUp : isUp;

  return (
    <span className={`ml-2 inline-flex items-center text-xs font-medium ${isPositive ? "text-green-600" : "text-red-500"}`}>
      {isUp ? "\u2191" : "\u2193"} {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg border bg-card"
          />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const cards = [
    {
      label: "Income",
      value: summary.totalIncome,
      prev: summary.prevTotalIncome,
      color: "text-green-600",
      border: "border-l-green-500",
      invertColor: false,
    },
    {
      label: "Expenses",
      value: summary.totalExpenses,
      prev: summary.prevTotalExpenses,
      color: "text-red-600",
      border: "border-l-red-500",
      invertColor: true,
    },
    {
      label: "Net",
      value: summary.net,
      prev: summary.prevNet,
      color: summary.net >= 0 ? "text-green-600" : "text-red-600",
      border: summary.net >= 0 ? "border-l-green-500" : "border-l-red-500",
      invertColor: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-lg border border-l-4 ${card.border} bg-card p-4`}
        >
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {card.label}
          </p>
          <div className="mt-2 flex items-baseline">
            <p className={`text-2xl font-bold ${card.color}`}>
              {formatCurrency(Math.abs(card.value))}
            </p>
            <ChangeIndicator
              current={card.value}
              previous={card.prev}
              invertColor={card.invertColor}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            vs prev: {formatCurrency(Math.abs(card.prev))}
          </p>
        </div>
      ))}
    </div>
  );
}
