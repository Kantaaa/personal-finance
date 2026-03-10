import type { ParseResult } from "./types";

/**
 * Parse Trumf CSV export.
 *
 * Expected format (semicolon-separated, Norwegian):
 *   Dato;Butikk;Beløp;Trumf opptjent
 *   08.03.2026;KIWI OSLO;350,00;3,50
 *
 * NOTE: Actual format may vary — update once a real sample is provided.
 */
export function parseTrumf(csvText: string): ParseResult {
  const lines = csvText.trim().split(/\r?\n/);
  const errors: string[] = [];
  const transactions: ParseResult["transactions"] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(";");
    if (cols.length < 3) {
      errors.push(`Line ${i + 1}: expected at least 3 columns, got ${cols.length}`);
      continue;
    }

    const [rawDate, store, rawAmount] = cols;

    const dateParts = rawDate.split(".");
    if (dateParts.length !== 3) {
      errors.push(`Line ${i + 1}: invalid date "${rawDate}"`);
      continue;
    }
    const date = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

    const amount = parseNorwegianNumber(rawAmount);
    if (amount === null) {
      errors.push(`Line ${i + 1}: invalid amount "${rawAmount}"`);
      continue;
    }

    // Trumf transactions are purchases (expenses) → negative
    transactions.push({
      date,
      amount: -Math.abs(amount),
      currency: "NOK",
      description: store.trim(),
      merchant: store.trim(),
      category: "Groceries",
    });
  }

  return { transactions, errors };
}

function parseNorwegianNumber(value: string): number | null {
  const cleaned = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}
