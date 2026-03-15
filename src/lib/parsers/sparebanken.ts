import type { ParseResult } from "./types";

/**
 * Parse Sparebanken Norge CSV export.
 *
 * Format (semicolon-separated):
 *   Dato;Type;Beskrivelse;Beløp
 *   17.02.2026;Overføring;="Månedlig sparing Betalt: 16.02.26";-10000
 *
 * Pure function — no DB, no auth, no category assignment.
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

    const [rawDate, rawType, rawDesc, rawAmount] = cols;

    // Parse date DD.MM.YYYY → YYYY-MM-DD
    const date = parseNorwegianDate(rawDate);
    if (!date) {
      errors.push(`Line ${i + 1}: invalid date "${rawDate}"`);
      continue;
    }

    // Strip Excel formula quoting: ="..." → ...
    const cleanedDesc = stripExcelFormula(rawDesc);

    // Remove "Betalt: DD.MM.YY" suffixes and trim
    const description = cleanDescription(cleanedDesc);

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
      merchant: extractMerchant(cleanedDesc),
      type: rawType.trim() || undefined,
      // category intentionally omitted — assigned by categorization engine
    });
  }

  return { transactions, errors };
}

/** DD.MM.YYYY → YYYY-MM-DD, returns null if invalid */
function parseNorwegianDate(value: string): string | null {
  const parts = value.trim().split(".");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  if (!day || !month || !year) return null;
  // Validate ranges
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (d < 1 || d > 31 || m < 1 || m > 12) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/** Strip Excel formula quoting: ="some text" → some text */
function stripExcelFormula(value: string): string {
  return value.replace(/^="/, "").replace(/"$/, "").trim();
}

/** Remove "Betalt: DD.MM.YY" and "Til: XXXX.XX.XXXXX" suffixes, trim */
function cleanDescription(desc: string): string {
  return desc
    .replace(/\s*Betalt:\s*\d{2}\.\d{2}\.\d{2}\s*$/i, "")
    .replace(/\s*Til:\s*[\d.]+\s*$/i, "")
    .trim();
}

function parseNorwegianNumber(value: string): number | null {
  const cleaned = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

/** Extract merchant name from common description patterns */
function extractMerchant(description: string): string | null {
  // "Nettgiro til: Dyreklinikk Lund" → "Dyreklinikk Lund"
  const tilMatch = description.match(/Nettgiro til:\s*(.+?)(?:\s*Betalt:|$)/i);
  if (tilMatch) return tilMatch[1].trim();

  // "Fra: Sparebanken Norge HR" → "Sparebanken Norge HR"
  const fraMatch = description.match(/Fra:\s*(.+?)(?:\s*Betalt:|$)/i);
  if (fraMatch) return fraMatch[1].trim();

  // "Fra: Frende Skadeforsikring AS Betalt: ..." → "Frende Skadeforsikring AS"
  // Already covered above

  // CRV* prefix (Curve-routed transactions)
  if (/^CRV\*/i.test(description)) {
    const name = description.replace(/^CRV\*/i, "").replace(/\s*CRV\*$/i, "").trim();
    const parts = name.split(/\s{2,}/);
    return parts[0] || name;
  }

  return null;
}
