import type { ParseResult } from "./types";

/**
 * Parse Curve card CSV export.
 *
 * Expected format (comma-separated):
 *   Date,Description,Amount,Currency,Category
 *   2026-03-08,SPOTIFY,9.99,EUR,Subscriptions
 *
 * NOTE: Actual format may vary — update once a real sample is provided.
 */
export function parseCurve(csvText: string): ParseResult {
  const lines = csvText.trim().split(/\r?\n/);
  const errors: string[] = [];
  const transactions: ParseResult["transactions"] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV split (doesn't handle quoted commas — enhance if needed)
    const cols = line.split(",");
    if (cols.length < 4) {
      errors.push(`Line ${i + 1}: expected at least 4 columns, got ${cols.length}`);
      continue;
    }

    const [date, description, rawAmount, currency] = cols;
    const category = cols[4]?.trim() || "Other";
    const amount = Number(rawAmount);

    if (isNaN(amount)) {
      errors.push(`Line ${i + 1}: invalid amount "${rawAmount}"`);
      continue;
    }

    // Curve amounts are typically negative for expenses
    transactions.push({
      date: date.trim(),
      amount,
      currency: currency.trim() || "NOK",
      description: description.trim(),
      merchant: description.trim(),
      category,
    });
  }

  return { transactions, errors };
}
