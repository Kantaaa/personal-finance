"use client";

import useSWR from "swr";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export type PeriodType = "week" | "month" | "year";

export interface Summary {
  totalIncome: number;
  totalExpenses: number;
  net: number;
  byCategory: Record<string, number>;
  transactionCount: number;
  dailyTotals: { date: string; income: number; expenses: number }[];
  prevTotalIncome: number;
  prevTotalExpenses: number;
  prevNet: number;
}

export function periodRange(
  periodType: PeriodType,
  refDate: Date,
): { from: string; to: string } {
  const y = refDate.getFullYear();
  const m = refDate.getMonth();
  const d = refDate.getDate();

  switch (periodType) {
    case "week": {
      const dayOfWeek = refDate.getDay();
      const monday = new Date(y, m, d - ((dayOfWeek + 6) % 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { from: iso(monday), to: iso(sunday) };
    }
    case "month":
      return {
        from: `${y}-${pad(m + 1)}-01`,
        to: iso(new Date(y, m + 1, 0)),
      };
    case "year":
      return { from: `${y}-01-01`, to: `${y}-12-31` };
  }
}

function prevPeriodDate(periodType: PeriodType, refDate: Date): Date {
  const d = new Date(refDate);
  switch (periodType) {
    case "week":
      d.setDate(d.getDate() - 7);
      break;
    case "month":
      d.setMonth(d.getMonth() - 1);
      break;
    case "year":
      d.setFullYear(d.getFullYear() - 1);
      break;
  }
  return d;
}

function iso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

interface TransactionRow {
  date: string;
  amount: number;
  category: string;
}

function aggregate(rows: TransactionRow[]) {
  let totalIncome = 0;
  let totalExpenses = 0;
  const byCategory: Record<string, number> = {};
  const dailyMap: Record<string, { income: number; expenses: number }> = {};

  for (const row of rows) {
    const amt = Number(row.amount);
    if (amt >= 0) {
      totalIncome += amt;
    } else {
      totalExpenses += amt;
    }
    byCategory[row.category] = (byCategory[row.category] ?? 0) + amt;

    if (!dailyMap[row.date]) {
      dailyMap[row.date] = { income: 0, expenses: 0 };
    }
    if (amt >= 0) {
      dailyMap[row.date].income += amt;
    } else {
      dailyMap[row.date].expenses += Math.abs(amt);
    }
  }

  const dailyTotals = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totals]) => ({ date, ...totals }));

  return { totalIncome, totalExpenses, net: totalIncome + totalExpenses, byCategory, dailyTotals, transactionCount: rows.length };
}

async function fetchSummary(
  _key: string,
  periodType: PeriodType,
  refDateStr: string,
): Promise<Summary> {
  const refDate = new Date(refDateStr);
  const { from, to } = periodRange(periodType, refDate);
  const prevRef = prevPeriodDate(periodType, refDate);
  const { from: prevFrom, to: prevTo } = periodRange(periodType, prevRef);

  const supabase = getSupabaseBrowserClient();

  // Fetch current and previous period in parallel
  const [current, previous] = await Promise.all([
    supabase
      .from("transactions")
      .select("date, amount, category")
      .gte("date", from)
      .lte("date", to),
    supabase
      .from("transactions")
      .select("amount")
      .gte("date", prevFrom)
      .lte("date", prevTo),
  ]);

  if (current.error) throw current.error;
  if (previous.error) throw previous.error;

  const curr = aggregate(current.data ?? []);

  let prevTotalIncome = 0;
  let prevTotalExpenses = 0;
  for (const row of previous.data ?? []) {
    const amt = Number(row.amount);
    if (amt >= 0) prevTotalIncome += amt;
    else prevTotalExpenses += amt;
  }

  return {
    ...curr,
    prevTotalIncome,
    prevTotalExpenses,
    prevNet: prevTotalIncome + prevTotalExpenses,
  };
}

export function useSummary(periodType: PeriodType, refDate: Date) {
  const key = ["summary", periodType, refDate.toISOString()];
  return useSWR(key, ([k, p, d]) => fetchSummary(k, p as PeriodType, d), {
    revalidateOnFocus: false,
  });
}
