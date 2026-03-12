"use client";

import { useState } from "react";
import Link from "next/link";
import { useSWRConfig } from "swr";
import type { SourceType } from "@/lib/parsers/types";
import { useAccounts } from "@/hooks/useAccounts";

interface UploadResult {
  inserted: number;
  dateRange: { from: string; to: string };
  parseErrors: string[];
}

const SOURCE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: "sparebanken", label: "Sparebanken Norge" },
  { value: "curve", label: "Curve" },
  { value: "trumf", label: "Trumf" },
];

export default function UploadPage() {
  const [source, setSource] = useState<SourceType>("sparebanken");
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { accounts, createAccount } = useAccounts();
  const { mutate: globalMutate } = useSWRConfig();

  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");

  async function handleCreateAccount() {
    if (!newAccountName.trim()) return;
    try {
      await createAccount(newAccountName.trim(), "bank", source);
      setNewAccountName("");
      setShowNewAccount(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("source", source);
      if (accountId) formData.set("accountId", accountId);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        if (data.parseErrors?.length) {
          setError((prev) => `${prev}\n\nParse errors:\n${data.parseErrors.join("\n")}`);
        }
      } else {
        setResult(data);
        // Invalidate transaction caches so new data shows immediately
        globalMutate((key) => Array.isArray(key) && key[0] === "transactions");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Upload Transactions</h1>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
          Dashboard
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="source" className="mb-1 block text-sm font-medium">
            Source
          </label>
          <select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value as SourceType)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="account" className="mb-1 block text-sm font-medium">
            Account
          </label>
          <div className="flex gap-2">
            <select
              id="account"
              value={accountId}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setShowNewAccount(true);
                  setAccountId("");
                } else {
                  setAccountId(e.target.value);
                }
              }}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
              <option value="__new__">+ Create new</option>
            </select>
          </div>
          {showNewAccount && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="Account name"
                className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={handleCreateAccount}
                disabled={!newAccountName.trim()}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowNewAccount(false)}
                className="rounded-md border px-3 py-1.5 text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="file" className="mb-1 block text-sm font-medium">
            CSV File
          </label>
          <input
            id="file"
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Supported formats: Sparebanken Norge (.csv), Curve (.csv), Trumf (.csv). Duplicates are skipped automatically.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-4">
          <p className="whitespace-pre-wrap text-sm text-destructive">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-md border bg-card p-4">
          <h2 className="mb-2 font-semibold">Upload successful</h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Transactions imported: <strong>{result.inserted}</strong></li>
            <li>Date range: {result.dateRange.from} to {result.dateRange.to}</li>
          </ul>
          {result.parseErrors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-destructive">
                {result.parseErrors.length} parse warning(s):
              </p>
              <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                {result.parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          <Link
            href="/transactions"
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            View transactions &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
