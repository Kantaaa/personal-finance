"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Account } from "@/hooks/useAccounts";

interface AddTransactionFormProps {
  categories: string[];
  accounts: Account[];
  onAdded: () => void;
}

export function AddTransactionForm({
  categories,
  accounts,
  onAdded,
}: AddTransactionFormProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Other");
  const [accountId, setAccountId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !description) return;

    setSaving(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setSaving(false);
      return;
    }
    const { error: insertError } = await supabase.from("transactions").insert({
      user_id: user.id,
      date,
      amount: parseFloat(amount),
      description,
      category,
      account_id: accountId || null,
      source_raw: "manual",
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setAmount("");
      setDescription("");
      onAdded();
    }

    setSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border bg-card p-4 space-y-3"
    >
      <h2 className="text-sm font-semibold">Add Transaction</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="-100.00"
            required
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          />
          <p className="mt-0.5 text-[10px] text-muted-foreground">Negative = expense, positive = income</p>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Account
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">None</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Coffee at Starbucks"
          required
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
        />
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving || !amount || !description}
        className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? "Adding..." : "Add"}
      </button>
    </form>
  );
}
