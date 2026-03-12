import type { ParseResult } from "./types";

/**
 * Parse Sparebanken Norge CSV export.
 *
 * Format (semicolon-separated):
 *   Dato;Type;Beskrivelse;Beløp
 *   27.02.2026;Varekjøp;="CRV*8640 KJITA 18 KRIS CRV*";-42
 */
export function parseSparebanken(csvText: string): ParseResult {
  const lines = csvText.trim().split(/\r?\n/);
  const errors: string[] = [];
  const transactions: ParseResult["transactions"] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(";");
    if (cols.length < 4) {
      errors.push(`Line ${i + 1}: expected at least 4 columns, got ${cols.length}`);
      continue;
    }

    const [rawDate, , rawDesc, rawAmount] = cols;

    // Parse date DD.MM.YYYY → YYYY-MM-DD
    const dateParts = rawDate.split(".");
    if (dateParts.length !== 3) {
      errors.push(`Line ${i + 1}: invalid date "${rawDate}"`);
      continue;
    }
    const date = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

    // Strip Excel formula quoting: ="..." → ...
    const description = rawDesc.replace(/^="/, "").replace(/"$/, "").trim();

    // Parse Norwegian number (comma as decimal separator)
    const amount = parseNorwegianNumber(rawAmount);
    if (amount === null) {
      errors.push(`Line ${i + 1}: invalid amount "${rawAmount}"`);
      continue;
    }

    transactions.push({
      date,
      amount,
      currency: "NOK",
      description,
      merchant: extractMerchant(description),
      category: guessCategory(description),
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

function extractMerchant(description: string): string {
  // Strip CRV* prefix/suffix (Curve-routed transactions)
  const name = description.replace(/^CRV\*/i, "").replace(/\s*CRV\*$/i, "").trim();
  // Take text before location/city info (rough heuristic)
  const parts = name.split(/\s{2,}/);
  return parts[0] || name;
}

function guessCategory(description: string): string {
  const d = description.toLowerCase();

  // Income
  if (/\blønn\b|salary|fra:.*hr\b/i.test(d)) return "Income";
  if (/forsikring/i.test(d)) return "Insurance";

  // Housing & bills
  if (/bolig|strøm|husleie|lån|rent\b|nettgiro/i.test(d)) return "Housing";

  // Subscriptions
  if (/google.*youtube|hbomax|apple.*bill|microsoft.*365|spotify|anthropic/i.test(d))
    return "Subscriptions";

  // Transport
  if (/sas airline|widerøe|wideroe|skandinavisk tr|voi\b|ruter|vy\b|flytoget/i.test(d))
    return "Transport";

  // Eating out
  if (/sushi|restaurant|pizza|burger|mcdonald/i.test(d))
    return "Eating out";

  // Groceries
  if (/kiwi|rema|coop|meny|bunnpris|joker|spar\b/i.test(d))
    return "Groceries";

  // Health
  if (/gymgrossisten|gym|dyreklinikk|dyrlege|apotek/i.test(d))
    return "Health";

  // Shopping
  if (/klarna|plantehallen/i.test(d)) return "Shopping";

  // Savings & transfers
  if (/sparing|månedlig sparing/i.test(d)) return "Savings";

  return "Other";
}
