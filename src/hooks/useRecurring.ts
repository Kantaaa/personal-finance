"use client";

import useSWR from "swr";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export interface RecurringTransaction {
  id: string;
  user_id: string;
  description_pattern: string;
  category: string;
  expected_amount: number;
  frequency: "weekly" | "monthly" | "yearly";
  next_expected_date: string;
  active: boolean;
  created_at: string;
}

export interface RecurringSuggestion {
  description_pattern: string;
  category: string;
  expected_amount: number;
  frequency: "monthly";
  occurrences: number;
}

async function fetchRecurring(): Promise<RecurringTransaction[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*")
    .order("next_expected_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function useRecurring() {
  const { data, error, isLoading, mutate } = useSWR(
    "recurring",
    fetchRecurring,
    { revalidateOnFocus: false },
  );

  async function createRecurring(
    item: Omit<RecurringTransaction, "id" | "user_id" | "created_at">,
  ) {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase.from("recurring_transactions").insert({
      user_id: user.id,
      ...item,
    });
    if (error) throw error;
    await mutate();
  }

  async function toggleActive(id: string, active: boolean) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("recurring_transactions")
      .update({ active })
      .eq("id", id);
    if (error) throw error;
    await mutate();
  }

  async function deleteRecurring(id: string) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("recurring_transactions")
      .delete()
      .eq("id", id);
    if (error) throw error;
    await mutate();
  }

  return {
    recurring: data ?? [],
    isLoading,
    error,
    mutate,
    createRecurring,
    toggleActive,
    deleteRecurring,
  };
}

/** Scan recent transactions to detect recurring patterns (monthly). */
export async function detectRecurring(): Promise<RecurringSuggestion[]> {
  const supabase = getSupabaseBrowserClient();

  // Fetch last 6 months of transactions
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const from = sixMonthsAgo.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("transactions")
    .select("merchant, description, category, amount, date")
    .gte("date", from)
    .order("date", { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Group by merchant/description (normalize to lowercase)
  const groups: Record<
    string,
    { category: string; amounts: number[]; dates: string[] }
  > = {};

  for (const t of data) {
    const key = (t.merchant || t.description || "").toLowerCase().trim();
    if (!key) continue;

    if (!groups[key]) {
      groups[key] = { category: t.category, amounts: [], dates: [] };
    }
    groups[key].amounts.push(Number(t.amount));
    groups[key].dates.push(t.date);
  }

  const suggestions: RecurringSuggestion[] = [];

  for (const [pattern, group] of Object.entries(groups)) {
    // Need at least 3 occurrences to suggest as recurring
    if (group.amounts.length < 3) continue;

    // Check if amounts are similar (within 20% of median)
    const sorted = [...group.amounts].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const allSimilar = group.amounts.every(
      (a) => Math.abs(a - median) <= Math.abs(median) * 0.2,
    );
    if (!allSimilar) continue;

    // Check if roughly monthly: avg gap between 20-40 days
    const dates = group.dates.sort();
    let totalGap = 0;
    for (let i = 1; i < dates.length; i++) {
      const d1 = new Date(dates[i - 1]);
      const d2 = new Date(dates[i]);
      totalGap += (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
    }
    const avgGap = totalGap / (dates.length - 1);
    if (avgGap < 20 || avgGap > 40) continue;

    const avgAmount =
      group.amounts.reduce((s, a) => s + a, 0) / group.amounts.length;

    suggestions.push({
      description_pattern: pattern,
      category: group.category,
      expected_amount: Math.round(avgAmount * 100) / 100,
      frequency: "monthly",
      occurrences: group.amounts.length,
    });
  }

  return suggestions.sort((a, b) => Math.abs(b.expected_amount) - Math.abs(a.expected_amount));
}
