"use client";

import useSWR from "swr";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export interface MonthData {
  month: string; // YYYY-MM
  label: string; // e.g. "Mar 2026"
  categories: Record<string, number>; // category -> abs expense amount
  totalExpenses: number;
  totalIncome: number;
}

async function fetchMonthlyTrend(): Promise<MonthData[]> {
  const supabase = getSupabaseBrowserClient();

  // Compute date range: 6 months back from start of current month
  const now = new Date();
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day of current month
  const startMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1); // first day, 5 months ago

  const from = `${startMonth.getFullYear()}-${String(startMonth.getMonth() + 1).padStart(2, "0")}-01`;
  const to = `${endMonth.getFullYear()}-${String(endMonth.getMonth() + 1).padStart(2, "0")}-${String(endMonth.getDate()).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("transactions")
    .select("date, amount, category")
    .gte("date", from)
    .lte("date", to);

  if (error) throw error;

  // Group by month
  const monthMap: Record<string, { categories: Record<string, number>; totalExpenses: number; totalIncome: number }> = {};

  for (const row of data ?? []) {
    const month = row.date.slice(0, 7); // YYYY-MM
    if (!monthMap[month]) {
      monthMap[month] = { categories: {}, totalExpenses: 0, totalIncome: 0 };
    }
    const amt = Number(row.amount);
    if (amt < 0) {
      monthMap[month].totalExpenses += Math.abs(amt);
      monthMap[month].categories[row.category] =
        (monthMap[month].categories[row.category] ?? 0) + Math.abs(amt);
    } else {
      monthMap[month].totalIncome += amt;
    }
  }

  // Build sorted array for all 6 months (include empty months)
  const result: MonthData[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en", { month: "short", year: "numeric" });
    const entry = monthMap[month];
    result.push({
      month,
      label,
      categories: entry?.categories ?? {},
      totalExpenses: entry?.totalExpenses ?? 0,
      totalIncome: entry?.totalIncome ?? 0,
    });
  }

  return result;
}

export function useMonthlyTrend() {
  return useSWR("monthly-trend", fetchMonthlyTrend, {
    revalidateOnFocus: false,
  });
}
