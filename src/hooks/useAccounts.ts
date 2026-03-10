"use client";

import useSWR from "swr";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export interface Account {
  id: string;
  name: string;
  type: string;
  provider: string;
  created_at: string;
}

async function fetchAccounts(): Promise<Account[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function useAccounts() {
  const { data, error, isLoading, mutate } = useSWR(
    "accounts",
    fetchAccounts,
    { revalidateOnFocus: false },
  );

  async function createAccount(name: string, type: string, provider: string) {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("accounts")
      .insert({ user_id: user.id, name, type, provider });
    if (error) throw error;
    await mutate();
  }

  async function deleteAccount(id: string) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) throw error;
    await mutate();
  }

  return { accounts: data ?? [], isLoading, error, mutate, createAccount, deleteAccount };
}
