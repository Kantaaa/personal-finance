"use client";

import useSWR from "swr";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

async function fetchCategories(): Promise<Category[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  // Auto-seed defaults if the user has no categories yet
  if (!data || data.length === 0) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    await supabase.rpc("seed_default_categories", { p_user_id: user.id });

    const { data: seeded, error: seedErr } = await supabase
      .from("categories")
      .select("id, name, sort_order")
      .order("sort_order", { ascending: true });

    if (seedErr) throw seedErr;
    return seeded ?? [];
  }

  return data;
}

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR(
    "categories",
    fetchCategories,
    { revalidateOnFocus: false },
  );

  const names = data?.map((c) => c.name) ?? [];

  async function addCategory(name: string) {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const maxOrder = data?.reduce((m, c) => Math.max(m, c.sort_order), 0) ?? 0;
    const { error } = await supabase
      .from("categories")
      .insert({ user_id: user.id, name, sort_order: maxOrder + 1 });
    if (error) throw error;
    await mutate();
  }

  async function deleteCategory(id: string) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
    await mutate();
  }

  return { categories: data ?? [], names, isLoading, error, mutate, addCategory, deleteCategory };
}
