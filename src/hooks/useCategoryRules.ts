"use client";

import useSWR from "swr";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export interface CategoryRule {
  id: string;
  keyword: string;
  category: string;
  priority: number;
  created_at: string;
}

async function fetchCategoryRules(): Promise<CategoryRule[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("category_rules")
    .select("id, keyword, category, priority, created_at")
    .order("priority", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function useCategoryRules() {
  const { data, error, isLoading, mutate } = useSWR(
    "category_rules",
    fetchCategoryRules,
    { revalidateOnFocus: false }
  );

  async function addRule(keyword: string, category: string, priority = 10) {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase.from("category_rules").insert({
      user_id: user.id,
      keyword: keyword.toLowerCase(),
      category,
      priority,
    });
    if (error) throw error;
    await mutate();
  }

  async function deleteRule(id: string) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("category_rules")
      .delete()
      .eq("id", id);
    if (error) throw error;
    await mutate();
  }

  async function seedDefaults() {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase.rpc("seed_default_category_rules", {
      p_user_id: user.id,
    });
    if (error) throw error;
    await mutate();
  }

  return {
    rules: data ?? [],
    isLoading,
    error,
    mutate,
    addRule,
    deleteRule,
    seedDefaults,
  };
}
