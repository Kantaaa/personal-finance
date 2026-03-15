export interface ParsedTransaction {
  date: string;           // YYYY-MM-DD
  amount: number;         // positive = income, negative = expense
  currency: string;
  description: string;
  merchant: string | null;
  category?: string;      // optional — assigned by categorization engine, not parser
  type?: string;          // original transaction type (e.g. Overføring, Innbetaling, Betaling)
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  errors: string[];
}

export type SourceType = "sparebanken" | "curve" | "trumf";
