import { describe, it, expect } from "vitest";
import { parseSparebanken } from "./sparebanken";
import { readFileSync } from "fs";
import { resolve } from "path";

const TESTDATA_CSV = readFileSync(
  resolve(__dirname, "../../../docs/Testdata1.csv"),
  "utf-8"
);

describe("parseSparebanken", () => {
  it("parses all 11 rows from Testdata1.csv with 0 errors", () => {
    const result = parseSparebanken(TESTDATA_CSV);
    expect(result.errors).toEqual([]);
    expect(result.transactions).toHaveLength(11);
  });

  it("converts Norwegian dates to YYYY-MM-DD", () => {
    const result = parseSparebanken(TESTDATA_CSV);
    expect(result.transactions[0].date).toBe("2026-02-17");
    expect(result.transactions[8].date).toBe("2026-02-13");
    expect(result.transactions[10].date).toBe("2026-02-04");
  });

  it("parses Norwegian amounts correctly", () => {
    const result = parseSparebanken(TESTDATA_CSV);
    // Salary: 33101,67 → 33101.67
    const salary = result.transactions[8];
    expect(salary.amount).toBe(33101.67);
    // Monthly savings: -10000
    expect(result.transactions[0].amount).toBe(-10000);
    // Insurance refund: 750
    expect(result.transactions[10].amount).toBe(750);
  });

  it("strips Excel formula quoting", () => {
    const result = parseSparebanken(TESTDATA_CSV);
    // ="Månedlig sparing Betalt: 16.02.26" → "Månedlig sparing"
    expect(result.transactions[0].description).not.toContain('="');
    expect(result.transactions[0].description).not.toContain('"');
  });

  it("cleans Betalt: suffixes from descriptions", () => {
    const result = parseSparebanken(TESTDATA_CSV);
    // Should not end with "Betalt: XX.XX.XX"
    for (const t of result.transactions) {
      expect(t.description).not.toMatch(/Betalt:\s*\d{2}\.\d{2}\.\d{2}\s*$/);
    }
  });

  it("preserves transaction type", () => {
    const result = parseSparebanken(TESTDATA_CSV);
    expect(result.transactions[0].type).toBe("Overføring");
    expect(result.transactions[8].type).toBe("Innbetaling");
    expect(result.transactions[9].type).toBe("Betaling");
  });

  it("extracts merchant from Fra: and Nettgiro til: patterns", () => {
    const result = parseSparebanken(TESTDATA_CSV);
    // "Fra: Sparebanken Norge HR" → merchant = "Sparebanken Norge HR"
    const salary = result.transactions[8];
    expect(salary.merchant).toBe("Sparebanken Norge HR");
    // "Nettgiro til: Dyreklinikk Lund" → merchant = "Dyreklinikk Lund"
    const vet = result.transactions[9];
    expect(vet.merchant).toBe("Dyreklinikk Lund");
    // "Fra: Frende Skadeforsikring AS" → merchant
    const insurance = result.transactions[10];
    expect(insurance.merchant).toBe("Frende Skadeforsikring AS");
  });

  it("does NOT assign categories", () => {
    const result = parseSparebanken(TESTDATA_CSV);
    for (const t of result.transactions) {
      expect(t.category).toBeUndefined();
    }
  });

  it("returns 0 transactions for header-only file", () => {
    const result = parseSparebanken("Dato;Type;Beskrivelse;Beløp\n");
    expect(result.transactions).toHaveLength(0);
    expect(result.errors).toEqual([]);
  });

  it("handles empty input gracefully", () => {
    const result = parseSparebanken("");
    expect(result.transactions).toHaveLength(0);
    expect(result.errors).toEqual([]);
  });

  it("reports error for malformed rows without crashing", () => {
    const csv = "Dato;Type;Beskrivelse;Beløp\nbad;data\n17.02.2026;Overføring;=\"Test\";-100";
    const result = parseSparebanken(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Line 2");
    expect(result.transactions).toHaveLength(1);
  });

  it("reports error for invalid date", () => {
    const csv = "Dato;Type;Beskrivelse;Beløp\nnotadate;Overføring;=\"Test\";-100";
    const result = parseSparebanken(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("invalid date");
  });

  it("reports error for invalid amount", () => {
    const csv = "Dato;Type;Beskrivelse;Beløp\n17.02.2026;Overføring;=\"Test\";abc";
    const result = parseSparebanken(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("invalid amount");
  });
});
