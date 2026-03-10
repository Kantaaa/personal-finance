"use client";

import useSWR from "swr";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export interface Budget {
  id: string;
  category: string;
  amount: number;
}

async function fetchBudgets(): Promise<Budget[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("id, category, amount")
    .order("category", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function useBudgets() {
  const { data, error, isLoading, mutate } = useSWR(
    "budgets",
    fetchBudgets,
    { revalidateOnFocus: false },
  );

  const byCategory: Record<string, number> = {};
  for (const b of data ?? []) {
    byCategory[b.category] = b.amount;
  }

  async function setBudget(category: string, amount: number) {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase.from("budgets").upsert(
      { user_id: user.id, category, amount, updated_at: new Date().toISOString() },
      { onConflict: "user_id,category" },
    );
    if (error) throw error;
    await mutate();
  }

  async function deleteBudget(id: string) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) throw error;
    await mutate();
  }

  return {
    budgets: data ?? [],
    byCategory,
    isLoading,
    error,
    mutate,
    setBudget,
    deleteBudget,
  };
}
