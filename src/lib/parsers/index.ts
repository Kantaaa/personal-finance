import type { ParseResult, SourceType } from "./types";
import { parseSparebanken } from "./sparebanken";
import { parseCurve } from "./curve";
import { parseTrumf } from "./trumf";

export type { ParseResult, SourceType, ParsedTransaction } from "./types";

const parsers: Record<SourceType, (csv: string) => ParseResult> = {
  sparebanken: parseSparebanken,
  curve: parseCurve,
  trumf: parseTrumf,
};

export function parseCSV(source: SourceType, csvText: string): ParseResult {
  const parser = parsers[source];
  if (!parser) {
    return { transactions: [], errors: [`Unknown source type: ${source}`] };
  }
  return parser(csvText);
}
