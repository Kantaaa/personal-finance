"use client";

import useSWR from "swr";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  description: string | null;
  merchant: string | null;
  category: string;
  source_raw: string | null;
  account_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface TransactionFilters {
  from?: string;
  to?: string;
  category?: string;
  source?: string;
  search?: string;
}

const PAGE_SIZE = 50;

interface PaginatedResult {
  data: Transaction[];
  totalCount: number;
}

function buildKey(filters: TransactionFilters, page: number) {
  return ["transactions", JSON.stringify(filters), String(page)];
}

async function fetchTransactions(
  _key: string,
  filtersJson: string,
  pageStr: string,
): Promise<PaginatedResult> {
  const filters: TransactionFilters = JSON.parse(filtersJson);
  const page = parseInt(pageStr, 10);
  const supabase = getSupabaseBrowserClient();

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .order("date", { ascending: false })
    .range(from, to);

  if (filters.from) query = query.gte("date", filters.from);
  if (filters.to) query = query.lte("date", filters.to);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.source) query = query.ilike("source_raw", `${filters.source}%`);
  if (filters.search) {
    query = query.or(
      `description.ilike.%${filters.search}%,merchant.ilike.%${filters.search}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data ?? [], totalCount: count ?? 0 };
}

export function useTransactions(filters: TransactionFilters = {}, page = 0) {
  const key = buildKey(filters, page);
  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([k, f, p]) => fetchTransactions(k, f, p),
    { revalidateOnFocus: false },
  );

  return {
    data: data?.data ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export { PAGE_SIZE };

export interface TransactionUpdate {
  date?: string;
  amount?: number;
  description?: string;
  merchant?: string | null;
  category?: string;
  notes?: string | null;
  account_id?: string | null;
}

export async function updateTransaction(id: string, fields: TransactionUpdate) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("transactions")
    .update(fields)
    .eq("id", id);
  if (error) throw error;
}

export async function updateTransactionCategory(
  id: string,
  category: string,
) {
  return updateTransaction(id, { category });
}

export async function bulkUpdateCategory(ids: string[], category: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("transactions")
    .update({ category })
    .in("id", ids);
  if (error) throw error;
}

export async function bulkDeleteTransactions(ids: string[]) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .in("id", ids);
  if (error) throw error;
}

export async function deleteTransaction(id: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
