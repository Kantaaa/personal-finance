import type { ParsedTransaction } from "./parsers/types";

export interface CategoryRule {
  id: string;
  keyword: string;   // lowercase match pattern
  category: string;  // target category name
  priority: number;  // higher = checked first
}

/**
 * Assign categories to parsed transactions based on keyword rules.
 *
 * Pure function — no DB calls, no auth. Rules are passed in.
 *
 * Logic:
 * 1. For each transaction, lowercase the description
 * 2. Check rules sorted by priority (highest first)
 * 3. First keyword match wins
 * 4. Positive amounts with no match → "Income"
 * 5. No match → "Other"
 */
export function categorize(
  transactions: ParsedTransaction[],
  rules: CategoryRule[]
): ParsedTransaction[] {
  // Sort rules by priority descending (highest first)
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);

  return transactions.map((t) => {
    const desc = t.description.toLowerCase();
    const matched = sorted.find((rule) => desc.includes(rule.keyword));

    let category: string;
    if (matched) {
      category = matched.category;
    } else if (t.amount > 0) {
      category = "Income";
    } else {
      category = "Other";
    }

    return { ...t, category };
  });
}
