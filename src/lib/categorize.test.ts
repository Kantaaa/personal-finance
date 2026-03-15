import { describe, it, expect } from "vitest";
import { categorize, type CategoryRule } from "./categorize";
import { parseSparebanken } from "./parsers/sparebanken";
import { readFileSync } from "fs";
import { resolve } from "path";

const TESTDATA_CSV = readFileSync(
  resolve(__dirname, "../../docs/Testdata1.csv"),
  "utf-8"
);

// Default rules matching the seed_default_category_rules function
const DEFAULT_RULES: CategoryRule[] = [
  { id: "1", keyword: "rema", category: "Groceries", priority: 10 },
  { id: "2", keyword: "kiwi", category: "Groceries", priority: 10 },
  { id: "3", keyword: "vy", category: "Transport", priority: 10 },
  { id: "4", keyword: "dyreklinikk", category: "Health", priority: 10 },
  { id: "5", keyword: "frende", category: "Insurance", priority: 10 },
  { id: "6", keyword: "sparing", category: "Savings", priority: 10 },
  { id: "7", keyword: "innbetaling", category: "Income", priority: 5 },
  { id: "8", keyword: "netflix", category: "Subscriptions", priority: 10 },
  { id: "9", keyword: "peppes", category: "Eating out", priority: 10 },
];

describe("categorize", () => {
  it("assigns categories to all Testdata1 transactions", () => {
    const parsed = parseSparebanken(TESTDATA_CSV);
    const result = categorize(parsed.transactions, DEFAULT_RULES);
    expect(result).toHaveLength(11);
    for (const t of result) {
      expect(t.category).toBeDefined();
      expect(t.category).not.toBe("");
    }
  });

  it("matches 'sparing' keyword → Savings", () => {
    const parsed = parseSparebanken(TESTDATA_CSV);
    const result = categorize(parsed.transactions, DEFAULT_RULES);
    // "Månedlig sparing" should match "sparing"
    const savings = result[0];
    expect(savings.category).toBe("Savings");
  });

  it("matches 'dyreklinikk' keyword → Health", () => {
    const parsed = parseSparebanken(TESTDATA_CSV);
    const result = categorize(parsed.transactions, DEFAULT_RULES);
    // "Nettgiro til: Dyreklinikk Lund" should match "dyreklinikk"
    const vet = result[9];
    expect(vet.category).toBe("Health");
  });

  it("matches 'frende' keyword → Insurance", () => {
    const parsed = parseSparebanken(TESTDATA_CSV);
    const result = categorize(parsed.transactions, DEFAULT_RULES);
    // "Fra: Frende Skadeforsikring AS" should match "frende"
    const insurance = result[10];
    expect(insurance.category).toBe("Insurance");
  });

  it("assigns 'Income' to positive amounts with no keyword match", () => {
    const parsed = parseSparebanken(TESTDATA_CSV);
    const result = categorize(parsed.transactions, DEFAULT_RULES);
    // Salary from "Sparebanken Norge HR" — no keyword match, but positive amount
    const salary = result[8];
    expect(salary.category).toBe("Income");
  });

  it("assigns 'Other' to negative amounts with no keyword match", () => {
    const parsed = parseSparebanken(TESTDATA_CSV);
    const result = categorize(parsed.transactions, DEFAULT_RULES);
    // "Gaver" — no keyword match, negative amount
    const gaver = result[1];
    expect(gaver.category).toBe("Other");
  });

  it("respects priority ordering", () => {
    const transactions = [
      { date: "2026-01-01", amount: -100, currency: "NOK", description: "Rema Sparing Combo", merchant: null },
    ];
    // "sparing" has higher priority than "rema" in this test
    const rules: CategoryRule[] = [
      { id: "1", keyword: "rema", category: "Groceries", priority: 5 },
      { id: "2", keyword: "sparing", category: "Savings", priority: 10 },
    ];
    const result = categorize(transactions, rules);
    expect(result[0].category).toBe("Savings");
  });

  it("returns empty array for empty input", () => {
    const result = categorize([], DEFAULT_RULES);
    expect(result).toEqual([]);
  });

  it("works with no rules — all get Other or Income", () => {
    const transactions = [
      { date: "2026-01-01", amount: -100, currency: "NOK", description: "Something", merchant: null },
      { date: "2026-01-01", amount: 500, currency: "NOK", description: "Something else", merchant: null },
    ];
    const result = categorize(transactions, []);
    expect(result[0].category).toBe("Other");
    expect(result[1].category).toBe("Income");
  });
});
