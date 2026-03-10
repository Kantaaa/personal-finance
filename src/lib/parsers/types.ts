export interface ParsedTransaction {
  date: string;           // YYYY-MM-DD
  amount: number;         // positive = income, negative = expense
  currency: string;
  description: string;
  merchant: string | null;
  category: string;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  errors: string[];
}

export type SourceType = "sparebanken" | "curve" | "trumf";
