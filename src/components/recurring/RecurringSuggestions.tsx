"use client";

import { useState } from "react";
import type { RecurringSuggestion } from "@/hooks/useRecurring";
import { formatCurrency } from "@/lib/utils";

interface RecurringSuggestionsProps {
  suggestions: RecurringSuggestion[];
  onAccept: (suggestion: RecurringSuggestion) => Promise<void>;
  onDismiss: (index: number) => void;
}

export function RecurringSuggestions({
  suggestions,
  onAccept,
  onDismiss,
}: RecurringSuggestionsProps) {
  const [accepting, setAccepting] = useState<number | null>(null);

  if (suggestions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          No recurring patterns detected. Keep adding transactions and try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 font-semibold">Detected Recurring Transactions</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        We found these patterns in your recent transactions. Accept to track them as recurring.
      </p>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium capitalize">{s.description_pattern}</p>
              <p className="text-xs text-muted-foreground">
                {s.category} &middot; {s.frequency} &middot; ~{formatCurrency(s.expected_amount)} &middot; {s.occurrences} occurrences
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setAccepting(i);
                  await onAccept(s);
                  setAccepting(null);
                }}
                disabled={accepting === i}
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {accepting === i ? "Adding..." : "Accept"}
              </button>
              <button
                onClick={() => onDismiss(i)}
                className="rounded-md border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
