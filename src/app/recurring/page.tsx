"use client";

import { useState, useEffect, useCallback } from "react";
import { NavBar } from "@/components/NavBar";
import { RecurringSuggestions } from "@/components/recurring/RecurringSuggestions";
import {
  useRecurring,
  detectRecurring,
  type RecurringSuggestion,
} from "@/hooks/useRecurring";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function RecurringPage() {
  const {
    recurring,
    isLoading,
    createRecurring,
    toggleActive,
    deleteRecurring,
  } = useRecurring();
  const [suggestions, setSuggestions] = useState<RecurringSuggestion[]>([]);
  const [scanning, setScanning] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const runScan = useCallback(async () => {
    setScanning(true);
    try {
      const results = await detectRecurring();
      // Filter out patterns that already exist
      const existingPatterns = new Set(
        recurring.map((r) => r.description_pattern.toLowerCase()),
      );
      const filtered = results.filter(
        (s) => !existingPatterns.has(s.description_pattern.toLowerCase()),
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } catch {
      // ignore scan errors silently
    }
    setScanning(false);
  }, [recurring]);

  // Auto-scan on first visit
  useEffect(() => {
    const hasScanned = localStorage.getItem("recurring_has_scanned");
    if (!hasScanned && !isLoading) {
      localStorage.setItem("recurring_has_scanned", "1");
      // This intentionally kicks off the scan once on first visit.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      runScan();
    }
  }, [isLoading, runScan]);

  async function handleAccept(suggestion: RecurringSuggestion) {
    // Calculate next expected date (1 month from last known occurrence)
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    const nextDateStr = nextDate.toISOString().slice(0, 10);

    await createRecurring({
      description_pattern: suggestion.description_pattern,
      category: suggestion.category,
      expected_amount: suggestion.expected_amount,
      frequency: suggestion.frequency,
      next_expected_date: nextDateStr,
      active: true,
    });

    setSuggestions((prev) =>
      prev.filter((s) => s.description_pattern !== suggestion.description_pattern),
    );
  }

  function handleDismiss(index: number) {
    setSuggestions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleDelete(id: string) {
    if (deletingId === id) {
      await deleteRecurring(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
    }
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Recurring Transactions</h1>
          <button
            onClick={runScan}
            disabled={scanning}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {scanning ? "Scanning..." : "Re-scan"}
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="mb-6">
            <RecurringSuggestions
              suggestions={suggestions}
              onAccept={handleAccept}
              onDismiss={handleDismiss}
            />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg border bg-card" />
            ))}
          </div>
        ) : recurring.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-lg font-medium">No recurring transactions yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Click &quot;Re-scan&quot; to detect recurring patterns from your transactions,
              or they&apos;ll be detected automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recurring.map((r) => (
              <div
                key={r.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  r.active ? "bg-card" : "bg-muted/30 opacity-60"
                }`}
              >
                <div>
                  <p className="text-sm font-medium capitalize">
                    {r.description_pattern}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.category} &middot; {r.frequency} &middot;{" "}
                    {formatCurrency(r.expected_amount)} &middot; Next:{" "}
                    {formatDate(r.next_expected_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(r.id, !r.active)}
                    className={`rounded-md border px-3 py-1 text-xs ${
                      r.active
                        ? "text-muted-foreground hover:text-foreground"
                        : "text-primary hover:bg-primary/10"
                    }`}
                  >
                    {r.active ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    onBlur={() => {
                      if (deletingId === r.id) setDeletingId(null);
                    }}
                    className={`text-xs ${
                      deletingId === r.id
                        ? "font-medium text-destructive"
                        : "text-muted-foreground hover:text-destructive"
                    }`}
                  >
                    {deletingId === r.id ? "Confirm?" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
