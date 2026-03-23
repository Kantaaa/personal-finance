"use client";

import { useState, useMemo, useRef } from "react";
import {
  useV3Store,
  formatNOK,
  CATEGORIES,
  type CategoryName,
  type Transaction,
  findPossibleDuplicates,
} from "@/app/v3/lib/store";
import { parseCSV, type SourceType, type ParsedTransaction } from "@/lib/parsers";
import { categorize, type CategoryRule } from "@/lib/categorize";

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const categoryMap = Object.fromEntries(
  CATEGORIES.map((c) => [c.name, c])
) as Record<CategoryName, (typeof CATEGORIES)[number]>;

// Map v1 category names to v3 category names (case-insensitive lookup)
const CATEGORY_NAME_MAP: Record<string, CategoryName> = {};
for (const cat of CATEGORIES) {
  CATEGORY_NAME_MAP[cat.name.toLowerCase()] = cat.name;
}
CATEGORY_NAME_MAP["eating out"] = "Eating Out";
CATEGORY_NAME_MAP["income"] = "Other";

function mapToV3Category(category: string): CategoryName {
  return CATEGORY_NAME_MAP[category.toLowerCase()] ?? "Other";
}

// Default categorization rules — Norwegian banking patterns
const DEFAULT_RULES: CategoryRule[] = [
  // Groceries
  { id: "1", keyword: "rema", category: "Groceries", priority: 10 },
  { id: "2", keyword: "kiwi", category: "Groceries", priority: 10 },
  { id: "3", keyword: "meny", category: "Groceries", priority: 10 },
  { id: "4", keyword: "coop", category: "Groceries", priority: 10 },
  { id: "5", keyword: "bunnpris", category: "Groceries", priority: 10 },
  { id: "6", keyword: "spar ", category: "Groceries", priority: 10 },
  { id: "7", keyword: "joker", category: "Groceries", priority: 10 },
  { id: "8", keyword: "extra ", category: "Groceries", priority: 9 },
  { id: "9", keyword: "norgesgruppen", category: "Groceries", priority: 10 },
  // Transport
  { id: "10", keyword: "vy ", category: "Transport", priority: 10 },
  { id: "11", keyword: "ruter", category: "Transport", priority: 10 },
  { id: "12", keyword: "circle k", category: "Transport", priority: 10 },
  { id: "13", keyword: "esso", category: "Transport", priority: 10 },
  { id: "14", keyword: "shell", category: "Transport", priority: 10 },
  { id: "15", keyword: "bensin", category: "Transport", priority: 10 },
  { id: "16", keyword: "parkering", category: "Transport", priority: 10 },
  { id: "17", keyword: "autopass", category: "Transport", priority: 10 },
  { id: "18", keyword: "bompenger", category: "Transport", priority: 10 },
  { id: "19", keyword: "taxi", category: "Transport", priority: 10 },
  // Eating Out
  { id: "20", keyword: "peppes", category: "Eating out", priority: 10 },
  { id: "21", keyword: "restaurant", category: "Eating out", priority: 10 },
  { id: "22", keyword: "cafe", category: "Eating out", priority: 10 },
  { id: "23", keyword: "espresso", category: "Eating out", priority: 10 },
  { id: "24", keyword: "starbucks", category: "Eating out", priority: 10 },
  { id: "25", keyword: "burger", category: "Eating out", priority: 10 },
  { id: "26", keyword: "pizza", category: "Eating out", priority: 10 },
  { id: "27", keyword: "sushi", category: "Eating out", priority: 10 },
  { id: "28", keyword: "mcdonalds", category: "Eating out", priority: 10 },
  { id: "29", keyword: "wolt", category: "Eating out", priority: 10 },
  { id: "2a", keyword: "foodora", category: "Eating out", priority: 10 },
  { id: "2b", keyword: "just eat", category: "Eating out", priority: 10 },
  // Subscriptions
  { id: "30", keyword: "netflix", category: "Subscriptions", priority: 10 },
  { id: "31", keyword: "spotify", category: "Subscriptions", priority: 10 },
  { id: "32", keyword: "hbo", category: "Subscriptions", priority: 10 },
  { id: "33", keyword: "viaplay", category: "Subscriptions", priority: 10 },
  { id: "34", keyword: "youtube", category: "Subscriptions", priority: 10 },
  { id: "35", keyword: "disney", category: "Subscriptions", priority: 10 },
  { id: "36", keyword: "apple.com", category: "Subscriptions", priority: 10 },
  { id: "37", keyword: "abo.", category: "Subscriptions", priority: 8 },
  // Health
  { id: "40", keyword: "dyreklinikk", category: "Health", priority: 10 },
  { id: "41", keyword: "apotek", category: "Health", priority: 10 },
  { id: "42", keyword: "lege", category: "Health", priority: 10 },
  { id: "43", keyword: "dyrlege", category: "Health", priority: 10 },
  { id: "44", keyword: "tannlege", category: "Health", priority: 10 },
  { id: "45", keyword: "sykehus", category: "Health", priority: 10 },
  { id: "46", keyword: "legevakt", category: "Health", priority: 10 },
  { id: "47", keyword: "gym", category: "Health", priority: 8 },
  { id: "48", keyword: "treningssenter", category: "Health", priority: 10 },
  { id: "49", keyword: "sats", category: "Health", priority: 10 },
  // Insurance
  { id: "50", keyword: "frende", category: "Insurance", priority: 10 },
  { id: "51", keyword: "if forsikring", category: "Insurance", priority: 10 },
  { id: "52", keyword: "gjensidige", category: "Insurance", priority: 10 },
  { id: "53", keyword: "tryg", category: "Insurance", priority: 10 },
  { id: "54", keyword: "forsikring", category: "Insurance", priority: 8 },
  { id: "55", keyword: "fskr.", category: "Insurance", priority: 8 },
  { id: "56", keyword: "skadeforsikring", category: "Insurance", priority: 10 },
  // Savings
  { id: "60", keyword: "sparing", category: "Savings", priority: 10 },
  { id: "61", keyword: "sparekonto", category: "Savings", priority: 10 },
  { id: "62", keyword: "månedlig sparing", category: "Savings", priority: 12 },
  // Shopping
  { id: "70", keyword: "h&m", category: "Shopping", priority: 10 },
  { id: "71", keyword: "zara", category: "Shopping", priority: 10 },
  { id: "72", keyword: "ikea", category: "Shopping", priority: 10 },
  { id: "73", keyword: "xxl", category: "Shopping", priority: 10 },
  { id: "74", keyword: "power", category: "Shopping", priority: 7 },
  { id: "75", keyword: "elkjøp", category: "Shopping", priority: 10 },
  { id: "76", keyword: "claes ohlson", category: "Shopping", priority: 10 },
  { id: "77", keyword: "gaver", category: "Shopping", priority: 8 },
  { id: "78", keyword: "fritid", category: "Shopping", priority: 7 },
  // Rent & Utilities
  { id: "80", keyword: "husleie", category: "Rent & Utilities", priority: 10 },
  { id: "81", keyword: "fjordkraft", category: "Rent & Utilities", priority: 10 },
  { id: "82", keyword: "tibber", category: "Rent & Utilities", priority: 10 },
  { id: "83", keyword: "telenor", category: "Rent & Utilities", priority: 10 },
  { id: "84", keyword: "telia", category: "Rent & Utilities", priority: 10 },
  { id: "85", keyword: "bolig", category: "Rent & Utilities", priority: 8 },
  { id: "86", keyword: "strøm", category: "Rent & Utilities", priority: 9 },
  { id: "87", keyword: "kommunale", category: "Rent & Utilities", priority: 10 },
  { id: "88", keyword: "felleskost", category: "Rent & Utilities", priority: 10 },
  { id: "89", keyword: "hafslund", category: "Rent & Utilities", priority: 10 },
  { id: "8a", keyword: "internett", category: "Rent & Utilities", priority: 10 },
  // Income detection
  { id: "90", keyword: "innbetaling", category: "Income", priority: 5 },
  { id: "91", keyword: "lønn", category: "Income", priority: 5 },
];

/* ── Preview transaction type (before import) ──────────────── */
interface PreviewTx extends ParsedTransaction {
  v3Category: CategoryName;
  isDuplicate: boolean;
  confidence: "high" | "low"; // "high" = matched a rule, "low" = defaulted to Other/Income
}

/* ── Category badge with inline editing ────────────────────── */
function CategoryBadge({
  category,
  confidence,
  editable,
  onChange,
}: {
  category: CategoryName;
  confidence?: "high" | "low";
  editable?: boolean;
  onChange?: (cat: CategoryName) => void;
}) {
  const cat = categoryMap[category];
  const [editing, setEditing] = useState(false);

  if (editable && editing) {
    return (
      <select
        autoFocus
        value={category}
        onChange={(e) => { onChange?.(e.target.value as CategoryName); setEditing(false); }}
        onBlur={() => setEditing(false)}
        className="rounded-full bg-[var(--v3-secondary-container)] px-3 py-1 text-xs font-medium text-[var(--v3-secondary)] border-none focus:outline-none focus:ring-1 focus:ring-[var(--v3-primary)] cursor-pointer"
      >
        {CATEGORIES.map((c) => (
          <option key={c.name} value={c.name}>{c.name}</option>
        ))}
      </select>
    );
  }

  const isLow = confidence === "low";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
        isLow
          ? "bg-[var(--v3-red-container)] text-[var(--v3-red)] ring-1 ring-[var(--v3-red)]/20"
          : "bg-[var(--v3-secondary-container)] text-[var(--v3-secondary)]"
      } ${editable ? "cursor-pointer hover:ring-1 hover:ring-[var(--v3-primary)]/30" : ""}`}
      onClick={() => editable && setEditing(true)}
      title={editable ? "Click to change category" : undefined}
    >
      <span className="material-symbols-outlined text-sm">{cat?.icon ?? "label"}</span>
      {category}
      {isLow && <span className="material-symbols-outlined text-[10px]">help</span>}
      {editable && !isLow && <span className="material-symbols-outlined text-[10px] opacity-50">edit</span>}
    </span>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
export default function TransactionsPage() {
  const {
    data, loaded, addTransaction, updateTransaction, deleteTransaction,
    customRules, addCustomRule, setMonth,
  } = useV3Store();

  // Form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryName>(CATEGORIES[0].name);
  const [date, setDate] = useState(todayString);

  // CSV import state
  const [importSource, setImportSource] = useState<SourceType>("sparebanken");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview state (step 2 of import flow)
  const [preview, setPreview] = useState<PreviewTx[] | null>(null);
  const [previewParseErrors, setPreviewParseErrors] = useState<string[]>([]);

  // Table state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "needs-review">("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // "Remember rule" prompt — track already-prompted descriptions to avoid repeats
  const [rulePrompt, setRulePrompt] = useState<{ txId: string; description: string; oldCat: CategoryName; newCat: CategoryName } | null>(null);
  const promptedDescriptions = useRef<Set<string>>(new Set());

  const transactions = data.transactions;

  const filtered = useMemo(() => {
    if (filterStatus === "all") return transactions;
    if (filterStatus === "needs-review") {
      return transactions.filter((t) => t.status === "pending" && t.category === "Other");
    }
    return transactions.filter((t) => t.status === filterStatus);
  }, [transactions, filterStatus]);

  const needsReviewCount = useMemo(
    () => transactions.filter((t) => t.status === "pending" && t.category === "Other").length,
    [transactions]
  );

  // Detect transactions outside the current budget month
  const outsideMonthCount = useMemo(
    () => transactions.filter((t) => !t.date.startsWith(data.month)).length,
    [transactions, data.month]
  );

  // Get unique months from transactions for quick-switch
  const txMonths = useMemo(() => {
    const months = new Set(transactions.map((t) => t.date.slice(0, 7)));
    return [...months].sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Review cards data
  const uncategorized = useMemo(
    () => transactions.filter((t) => t.status === "pending" && t.category === "Other"),
    [transactions]
  );

  const suggestions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.status !== "pending" || t.category === "Other") return false;
      // Check if a custom rule matches — if so, it's high confidence
      const descLower = t.description.toLowerCase();
      const hasCustomMatch = customRules.some((r) => descLower.includes(r.keyword));
      return !hasCustomMatch; // only show if no custom rule confirms it
    });
  }, [transactions, customRules]);

  const duplicates = useMemo(
    () => findPossibleDuplicates(transactions),
    [transactions]
  );

  const reviewCount = uncategorized.length + suggestions.length + duplicates.reduce((s, g) => s + g.transactions.length - 1, 0);

  // Build merged rules: custom rules (priority 15) + defaults
  const allRules = useMemo((): CategoryRule[] => {
    const custom: CategoryRule[] = customRules.map((r) => ({
      id: `custom-${r.id}`,
      keyword: r.keyword,
      category: r.category,
      priority: 15, // custom rules override defaults
    }));
    return [...custom, ...DEFAULT_RULES];
  }, [customRules]);

  // ── Handlers ──────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    addTransaction({
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date,
      status: "pending",
    });
    setDescription("");
    setAmount("");
    setCategory(CATEGORIES[0].name);
    setDate(todayString());
  }

  // Step 1: Parse CSV and show preview
  async function handleCsvParse(file: File) {
    setImporting(true);
    setImportError(null);
    setPreview(null);

    try {
      const csvText = await file.text();
      const { transactions: parsed, errors: parseErrors } = parseCSV(importSource, csvText);

      if (parsed.length === 0) {
        setImportError(`No valid transactions found.${parseErrors.length > 0 ? ` Errors: ${parseErrors.join("; ")}` : ""}`);
        setImporting(false);
        return;
      }

      // Categorize with merged rules
      const categorized = categorize(parsed, allRules);

      // Build dedup set
      const existingKeys = new Set(
        data.transactions.map((t) => `${t.date}|${t.amount}|${t.description}`)
      );

      // Build preview with confidence and duplicate detection
      const seenKeys = new Set<string>();
      const previewTxns: PreviewTx[] = categorized.map((tx) => {
        const key = `${tx.date}|${tx.amount}|${tx.description}`;
        const isDuplicate = existingKeys.has(key) || seenKeys.has(key);
        seenKeys.add(key);

        const v3Cat = mapToV3Category(tx.category ?? "Other");
        const confidence: "high" | "low" = (tx.category === "Other" || tx.category === "Income") ? "low" : "high";

        return { ...tx, v3Category: v3Cat, isDuplicate, confidence };
      });

      setPreview(previewTxns);
      setPreviewParseErrors(parseErrors);
    } catch (err) {
      setImportError(`Failed to process file: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Step 2: Confirm import from preview
  function handleConfirmImport() {
    if (!preview) return;
    const toImport = preview.filter((tx) => !tx.isDuplicate);
    for (const tx of toImport) {
      addTransaction({
        description: tx.description,
        amount: tx.amount,
        category: tx.v3Category,
        date: tx.date,
        status: "pending",
      });
    }
    setPreview(null);
  }

  // Update preview category inline
  function updatePreviewCategory(index: number, newCat: CategoryName) {
    if (!preview) return;
    setPreview(preview.map((tx, i) => i === index ? { ...tx, v3Category: newCat, confidence: "high" } : tx));
  }

  // Handle category change on existing transaction + offer to save rule (once per description)
  function handleCategoryChange(tx: Transaction, newCat: CategoryName) {
    updateTransaction(tx.id, { category: newCat });
    const descKey = tx.description.toLowerCase().trim();
    if (
      tx.category !== newCat &&
      descKey.length > 2 &&
      !promptedDescriptions.current.has(descKey) &&
      !customRules.some((r) => descKey.includes(r.keyword))
    ) {
      promptedDescriptions.current.add(descKey);
      setRulePrompt({ txId: tx.id, description: tx.description, oldCat: tx.category, newCat });
    }
  }

  // Also apply category change to all matching pending transactions with same description
  function applyCategoryToSimilar(description: string, newCat: CategoryName) {
    const descLower = description.toLowerCase().trim();
    for (const tx of data.transactions) {
      if (tx.status === "pending" && tx.description.toLowerCase().trim() === descLower && tx.category !== newCat) {
        updateTransaction(tx.id, { category: newCat });
      }
    }
  }

  // Approve all pending transactions that have a category (not "Other")
  function finishReview() {
    for (const tx of data.transactions) {
      if (tx.status === "pending" && tx.category !== "Other") {
        updateTransaction(tx.id, { status: "approved" });
      }
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((t) => t.id)));
  }

  function approveAll() {
    filtered.filter((t) => t.status === "pending").forEach((t) => updateTransaction(t.id, { status: "approved" }));
  }

  function bulkDelete() {
    selected.forEach((id) => deleteTransaction(id));
    setSelected(new Set());
  }

  // ── Loading ──────────────────────────────────────────────

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-[var(--v3-primary)]">progress_activity</span>
      </div>
    );
  }

  const pendingCount = transactions.filter((t) => t.status === "pending").length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10">
      {/* ── 1. Header ── */}
      <section>
        <h1 className="font-[Manrope] text-3xl font-bold text-[var(--v3-text)]">Transaction Import</h1>
        <p className="mt-2 text-sm text-[var(--v3-text-muted)]">
          Upload bank CSV, review smart categorization, then approve to update your budget.
        </p>
      </section>

      {/* ── 2. Manual Entry + CSV Import ── */}
      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Manual form */}
        <div className="rounded-2xl border border-[var(--v3-border)] bg-[var(--v3-card)] p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--v3-primary)]">add_circle</span>
            <h2 className="font-[Manrope] text-lg font-semibold text-[var(--v3-text)]">Add Manually</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (e.g. REMA 1000, Netflix...)"
              className="w-full rounded-lg border border-[var(--v3-border)] bg-[var(--v3-surface-low)] px-3 py-2 text-sm text-[var(--v3-text)] placeholder:text-[var(--v3-outline)] focus:border-[var(--v3-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--v3-primary)]"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (-450)"
                className="rounded-lg border border-[var(--v3-border)] bg-[var(--v3-surface-low)] px-3 py-2 text-sm text-[var(--v3-text)] placeholder:text-[var(--v3-outline)] focus:border-[var(--v3-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--v3-primary)]" />
              <select value={category} onChange={(e) => setCategory(e.target.value as CategoryName)}
                className="rounded-lg border border-[var(--v3-border)] bg-[var(--v3-surface-low)] px-3 py-2 text-sm text-[var(--v3-text)] focus:border-[var(--v3-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--v3-primary)]">
                {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-[var(--v3-border)] bg-[var(--v3-surface-low)] px-3 py-2 text-sm text-[var(--v3-text)] focus:border-[var(--v3-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--v3-primary)]" />
            </div>
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--v3-gradient-from)] to-[var(--v3-gradient-to)] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 active:scale-[0.98]">
              <span className="material-symbols-outlined text-lg">add</span> Add Transaction
            </button>
          </form>
        </div>

        {/* CSV Import */}
        <div className="rounded-2xl border border-[var(--v3-border)] bg-[var(--v3-card)] p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--v3-secondary)]">upload_file</span>
            <h2 className="font-[Manrope] text-lg font-semibold text-[var(--v3-text)]">Import CSV</h2>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <select value={importSource} onChange={(e) => setImportSource(e.target.value as SourceType)}
                className="rounded-lg border border-[var(--v3-border)] bg-[var(--v3-surface-low)] px-3 py-2 text-sm text-[var(--v3-text)] focus:border-[var(--v3-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--v3-primary)]">
                <option value="sparebanken">Sparebanken Norge</option>
                <option value="curve">Curve</option>
                <option value="trumf">Trumf</option>
              </select>
              <label className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--v3-border)] bg-[var(--v3-surface-low)] px-4 py-2 text-sm font-medium cursor-pointer hover:border-[var(--v3-primary)] transition-colors" style={{ color: "var(--v3-primary)" }}>
                <span className="material-symbols-outlined text-lg">cloud_upload</span>
                {importing ? "Processing..." : "Choose CSV file"}
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsvParse(f); }} />
              </label>
            </div>
            {importError && (
              <div className="p-3 rounded-xl bg-[var(--v3-red-container)] text-sm flex items-start gap-2" style={{ color: "var(--v3-red)" }}>
                <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
                <span>{importError}</span>
              </div>
            )}
            <div className="text-[11px] leading-relaxed" style={{ color: "var(--v3-outline)" }}>
              <strong>Sparebanken:</strong> Dato;Type;Beskrivelse;Beløp &middot;
              <strong> Curve:</strong> Date,Description,Amount,Currency,Category &middot;
              <strong> Trumf:</strong> Dato;Butikk;Beløp
            </div>
            {customRules.length > 0 && (
              <div className="text-[11px]" style={{ color: "var(--v3-green)" }}>
                <span className="material-symbols-outlined text-[12px] mr-1">psychology</span>
                {customRules.length} learned rule{customRules.length !== 1 ? "s" : ""} will be applied to imports
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 3. Import Preview (shown after CSV parse, before confirm) ── */}
      {preview && (
        <section className="rounded-2xl border-2 border-[var(--v3-primary)]/30 bg-[var(--v3-card)] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[var(--v3-surface-high)] flex flex-wrap items-center justify-between gap-4" style={{ backgroundColor: "color-mix(in srgb, var(--v3-primary) 5%, transparent)" }}>
            <div>
              <h2 className="font-[Manrope] text-lg font-bold text-[var(--v3-text)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--v3-primary)]">preview</span>
                Import Preview
              </h2>
              <div className="flex gap-4 mt-1 text-xs" style={{ color: "var(--v3-text-muted)" }}>
                <span><strong>{preview.length}</strong> transactions found</span>
                <span><strong>{preview.filter((t) => !t.isDuplicate).length}</strong> new</span>
                <span><strong>{preview.filter((t) => t.isDuplicate).length}</strong> duplicates (will skip)</span>
                <span className={preview.filter((t) => t.confidence === "low" && !t.isDuplicate).length > 0 ? "text-[var(--v3-red)] font-semibold" : ""}>
                  <strong>{preview.filter((t) => t.confidence === "low" && !t.isDuplicate).length}</strong> need review
                </span>
                {preview.length > 0 && (
                  <span>
                    {preview[preview.length - 1].date} &ndash; {preview[0].date}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPreview(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--v3-border)] transition-colors hover:bg-[var(--v3-surface-low)]"
                style={{ color: "var(--v3-text-muted)" }}>
                Cancel
              </button>
              <button onClick={handleConfirmImport}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors flex items-center gap-2"
                style={{ backgroundColor: "var(--v3-primary)" }}>
                <span className="material-symbols-outlined text-[18px]">check</span>
                Import {preview.filter((t) => !t.isDuplicate).length} Transactions
              </button>
            </div>
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[var(--v3-surface-low)] text-xs font-medium uppercase tracking-wide text-[var(--v3-text-muted)]">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((tx, i) => (
                  <tr key={i} className={`border-b border-[var(--v3-surface-high)] ${tx.isDuplicate ? "opacity-40" : ""}`}>
                    <td className="px-6 py-3 text-xs tabular-nums" style={{ color: "var(--v3-text-muted)" }}>{tx.date}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--v3-text)" }}>{tx.description}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums" style={{ color: tx.amount >= 0 ? "var(--v3-green)" : "var(--v3-red)" }}>
                      {formatNOK(tx.amount)}
                    </td>
                    <td className="px-4 py-3">
                      {tx.isDuplicate ? (
                        <span className="text-xs" style={{ color: "var(--v3-outline)" }}>—</span>
                      ) : (
                        <CategoryBadge
                          category={tx.v3Category}
                          confidence={tx.confidence}
                          editable
                          onChange={(cat) => updatePreviewCategory(i, cat)}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {tx.isDuplicate ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: "var(--v3-surface-highest)", color: "var(--v3-outline)" }}>Duplicate</span>
                      ) : tx.confidence === "low" ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: "var(--v3-red-container)", color: "var(--v3-red)" }}>Review</span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: "color-mix(in srgb, var(--v3-green-light) 30%, transparent)", color: "var(--v3-green)" }}>Ready</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {previewParseErrors.length > 0 && (
            <div className="px-6 py-3 border-t border-[var(--v3-surface-high)]">
              <details className="text-xs" style={{ color: "var(--v3-text-muted)" }}>
                <summary className="cursor-pointer font-semibold">{previewParseErrors.length} parse warning{previewParseErrors.length !== 1 ? "s" : ""}</summary>
                <ul className="mt-1 space-y-0.5 pl-4 list-disc">
                  {previewParseErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </details>
            </div>
          )}
        </section>
      )}

      {/* ── Month Mismatch Warning ── */}
      {outsideMonthCount > 0 && transactions.length > 0 && (
        <div className="rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{ backgroundColor: "color-mix(in srgb, var(--v3-secondary-container) 40%, transparent)", border: "1px solid var(--v3-secondary-container)" }}>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5" style={{ color: "var(--v3-secondary)" }}>info</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--v3-text)" }}>
                {outsideMonthCount} transaction{outsideMonthCount !== 1 ? "s" : ""} outside budget month ({data.month})
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--v3-text-muted)" }}>
                Only approved transactions matching the budget month affect your actuals.
                Switch the budget month to match your imported data.
              </p>
            </div>
          </div>
          {txMonths.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium" style={{ color: "var(--v3-text-muted)" }}>Switch to:</span>
              <div className="flex gap-1">
                {txMonths.slice(0, 3).map((m) => (
                  <button key={m} onClick={() => setMonth(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${m === data.month ? "text-white" : ""}`}
                    style={m === data.month
                      ? { backgroundColor: "var(--v3-primary)", color: "white" }
                      : { backgroundColor: "var(--v3-card)", color: "var(--v3-primary)", border: "1px solid var(--v3-border)" }
                    }>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4. Review Section ── */}
      {/* Header with view toggle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--v3-secondary)" }}>Action Required</span>
          <h2 className="text-2xl font-[Manrope] font-extrabold tracking-tight" style={{ color: "var(--v3-text)" }}>Review Queue</h2>
          <p className="text-sm mt-1" style={{ color: "var(--v3-text-muted)" }}>
            {reviewCount > 0 ? `${reviewCount} items needing attention` : "All transactions reviewed"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex p-1 rounded-lg" style={{ backgroundColor: "var(--v3-surface-low)" }}>
            <button onClick={() => setViewMode("cards")}
              className="px-3 py-1.5 rounded text-xs font-bold transition-all"
              style={viewMode === "cards" ? { backgroundColor: "var(--v3-card)", color: "var(--v3-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } : { color: "var(--v3-outline)" }}>
              <span className="material-symbols-outlined text-sm mr-1">grid_view</span>Cards
            </button>
            <button onClick={() => setViewMode("table")}
              className="px-3 py-1.5 rounded text-xs font-bold transition-all"
              style={viewMode === "table" ? { backgroundColor: "var(--v3-card)", color: "var(--v3-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } : { color: "var(--v3-outline)" }}>
              <span className="material-symbols-outlined text-sm mr-1">view_list</span>Table
            </button>
          </div>
          {reviewCount > 0 && (
            <button onClick={finishReview}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, var(--v3-gradient-from), var(--v3-gradient-to))" }}>
              Finish &amp; Update Dashboard
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === "cards" ? (
        /* ── Card-Based Review View ── */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Section 1: Uncategorized (8 cols) */}
          {uncategorized.length > 0 && (
            <div className="xl:col-span-8 space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ color: "var(--v3-red)" }}>unknown_document</span>
                <h3 className="text-lg font-bold tracking-tight" style={{ color: "var(--v3-text)" }}>Uncategorized Transactions ({uncategorized.length})</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {uncategorized.map((tx) => (
                  <UncategorizedCard
                    key={tx.id}
                    tx={tx}
                    onChangeCategory={(cat) => handleCategoryChange(tx, cat)}
                    onSaveRule={(cat) => {
                      const desc = tx.description.toLowerCase();
                      const words = desc.split(/\s+/).filter((w) => w.length > 2).slice(0, 3);
                      const keyword = words.length > 0 ? words.join(" ") : desc.slice(0, 20);
                      addCustomRule(keyword, cat);
                      applyCategoryToSimilar(tx.description, cat);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Suggestions (4 cols or full if no uncategorized) */}
          {suggestions.length > 0 && (
            <div className={`${uncategorized.length > 0 ? "xl:col-span-4" : "xl:col-span-12"} space-y-4`}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ color: "var(--v3-secondary)" }}>psychology_alt</span>
                <h3 className="text-lg font-bold tracking-tight" style={{ color: "var(--v3-text)" }}>Confidence Review ({suggestions.length})</h3>
              </div>
              <div className={`${uncategorized.length > 0 ? "space-y-4" : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"}`}>
                {suggestions.slice(0, 6).map((tx) => (
                  <SuggestionCard
                    key={tx.id}
                    tx={tx}
                    onConfirm={() => updateTransaction(tx.id, { status: "approved" })}
                    onChangeCategory={(cat) => handleCategoryChange(tx, cat)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {uncategorized.length === 0 && suggestions.length === 0 && duplicates.length === 0 && (
            <div className="xl:col-span-12 flex flex-col items-center justify-center py-16" style={{ color: "var(--v3-text-muted)" }}>
              <span className="material-symbols-outlined mb-3 text-5xl" style={{ color: "var(--v3-green)" }}>check_circle</span>
              <h3 className="text-lg font-bold mb-1" style={{ color: "var(--v3-text)" }}>All Clear</h3>
              <p className="text-sm">No transactions need review. Import a CSV or add transactions manually.</p>
            </div>
          )}

          {/* Section 3: Duplicates (12 cols, bottom) */}
          {duplicates.length > 0 && (
            <div className="xl:col-span-12 space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ color: "var(--v3-red)" }}>content_copy</span>
                <h3 className="text-lg font-bold tracking-tight" style={{ color: "var(--v3-text)" }}>Possible Duplicates ({duplicates.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {duplicates.map((group) => (
                  <DuplicateCard
                    key={group.key}
                    group={group}
                    onKeep={(id) => updateTransaction(id, { status: "approved" })}
                    onDiscard={(id) => deleteTransaction(id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Table-Based View (existing) ── */
        <section className="rounded-2xl border border-[var(--v3-border)] bg-[var(--v3-card)] shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--v3-surface-high)] px-6 py-4">
            <div className="flex items-center gap-3">
              <h3 className="font-[Manrope] text-base font-semibold text-[var(--v3-text)]">All Transactions</h3>
              {pendingCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-[var(--v3-primary-alt)] px-2.5 py-0.5 text-xs font-medium text-white">
                  {pendingCount} pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="rounded-lg border border-[var(--v3-border)] bg-[var(--v3-card)] px-3 py-1.5 text-xs text-[var(--v3-text)] focus:border-[var(--v3-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--v3-primary)]">
                <option value="all">All ({transactions.length})</option>
                <option value="needs-review">Needs Review ({needsReviewCount})</option>
                <option value="pending">Pending ({pendingCount})</option>
                <option value="approved">Approved ({transactions.length - pendingCount})</option>
              </select>
              <button onClick={approveAll}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--v3-primary)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--v3-primary-alt)]">
                <span className="material-symbols-outlined text-sm">done_all</span> Approve All
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--v3-text-muted)]">
              <span className="material-symbols-outlined mb-2 text-4xl opacity-40">receipt_long</span>
              <p className="text-sm">
                {filterStatus === "needs-review"
                  ? "No transactions need review. All categorized!"
                  : "No transactions yet. Add one above or import a CSV!"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--v3-surface-high)] bg-[var(--v3-surface-low)] text-xs font-medium uppercase tracking-wide text-[var(--v3-text-muted)]">
                      <th className="w-10 px-6 py-3">
                        <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleAll}
                          className="h-4 w-4 rounded border-[var(--v3-border)] accent-[var(--v3-primary)]" />
                      </th>
                      <th className="px-4 py-3">Transaction Details</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="w-24 px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tx) => (
                      <TransactionRow
                        key={tx.id} tx={tx}
                        isSelected={selected.has(tx.id)}
                        onToggle={() => toggleSelect(tx.id)}
                        onApprove={() => updateTransaction(tx.id, { status: "approved" })}
                        onChangeCategory={(cat) => handleCategoryChange(tx, cat)}
                        onDelete={() => { deleteTransaction(tx.id); setSelected((prev) => { const next = new Set(prev); next.delete(tx.id); return next; }); }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-[var(--v3-surface-high)] px-6 py-3">
                <p className="text-xs text-[var(--v3-text-muted)]">Showing {filtered.length} of {transactions.length}</p>
              </div>
            </>
          )}
        </section>
      )}

      {/* ── 5. Floating Bulk Action Bar ── */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-50 mx-auto flex w-fit items-center gap-4 rounded-2xl bg-[var(--v3-inverse)] px-6 py-3 text-white shadow-2xl">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="h-5 w-px bg-white/20" />
          <button onClick={() => { selected.forEach((id) => updateTransaction(id, { status: "approved" })); setSelected(new Set()); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium transition hover:bg-white/20">
            <span className="material-symbols-outlined text-sm">check_circle</span> Approve
          </button>
          <button onClick={bulkDelete}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--v3-red)] px-3 py-1.5 text-xs font-medium transition hover:bg-[var(--v3-red)]/80">
            <span className="material-symbols-outlined text-sm">delete</span> Delete
          </button>
        </div>
      )}

      {/* ── 6. "Remember this rule?" prompt ── */}
      {rulePrompt && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setRulePrompt(null)} />
          <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 p-6 rounded-2xl shadow-2xl" style={{ backgroundColor: "var(--v3-card)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--v3-primary) 10%, transparent)", color: "var(--v3-primary)" }}>
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <div>
                <h3 className="font-[Manrope] font-bold" style={{ color: "var(--v3-text)" }}>Remember this?</h3>
                <p className="text-xs" style={{ color: "var(--v3-text-muted)" }}>Save as a rule for future imports</p>
              </div>
            </div>
            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: "var(--v3-surface-low)" }}>
              <p className="text-sm" style={{ color: "var(--v3-text)" }}>
                Transactions matching <strong>&quot;{rulePrompt.description.toLowerCase().slice(0, 30)}{rulePrompt.description.length > 30 ? "..." : ""}&quot;</strong> will be categorized as <strong>{rulePrompt.newCat}</strong> — including all similar pending transactions right now and in future imports.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRulePrompt(null)}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
                style={{ color: "var(--v3-text-muted)", backgroundColor: "var(--v3-surface-low)" }}>
                No thanks
              </button>
              <button onClick={() => {
                // Extract a meaningful keyword from the description
                const desc = rulePrompt.description.toLowerCase();
                // Use the first 2-3 meaningful words as keyword
                const words = desc.split(/\s+/).filter((w) => w.length > 2).slice(0, 3);
                const keyword = words.length > 0 ? words.join(" ") : desc.slice(0, 20);
                addCustomRule(keyword, rulePrompt.newCat);
                // Apply to all similar pending transactions
                applyCategoryToSimilar(rulePrompt.description, rulePrompt.newCat);
                setRulePrompt(null);
              }}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--v3-primary)" }}>
                <span className="material-symbols-outlined text-[18px]">save</span>
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Transaction row ───────────────────────────────────────── */
function TransactionRow({
  tx, isSelected, onToggle, onApprove, onChangeCategory, onDelete,
}: {
  tx: Transaction; isSelected: boolean;
  onToggle: () => void; onApprove: () => void;
  onChangeCategory: (cat: CategoryName) => void; onDelete: () => void;
}) {
  const isIncome = tx.amount >= 0;
  const isUncategorized = tx.category === "Other" && tx.status === "pending";

  return (
    <tr className={`group border-b border-[var(--v3-surface-high)] transition hover:bg-[var(--v3-surface-low)] ${isUncategorized ? "bg-[var(--v3-red-container)]/10" : ""}`}>
      <td className="px-6 py-3">
        <input type="checkbox" checked={isSelected} onChange={onToggle} className="h-4 w-4 rounded border-[var(--v3-border)] accent-[var(--v3-primary)]" />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="font-medium text-[var(--v3-text)]">{tx.description}</p>
            <p className="text-xs text-[var(--v3-text-muted)]">{tx.date}</p>
          </div>
          {tx.status === "pending" && (
            <span className="rounded-full bg-[var(--v3-surface-highest)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--v3-text-muted)]">Pending</span>
          )}
          {tx.status === "approved" && (
            <span className="rounded-full bg-[var(--v3-green-dim)]/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--v3-green)]">Approved</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <CategoryBadge category={tx.category} editable onChange={onChangeCategory} confidence={isUncategorized ? "low" : "high"} />
      </td>
      <td className="px-4 py-3 text-right font-semibold tabular-nums">
        <span className={isIncome ? "text-[var(--v3-green)]" : "text-[var(--v3-red)]"}>{formatNOK(tx.amount)}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1 opacity-0 transition group-hover:opacity-100">
          {tx.status === "pending" && (
            <button onClick={onApprove} title="Approve" className="rounded-lg p-1 text-[var(--v3-primary)] transition hover:bg-[var(--v3-primary)]/10">
              <span className="material-symbols-outlined text-xl">check_circle</span>
            </button>
          )}
          <button onClick={onDelete} title="Delete" className="rounded-lg p-1 text-[var(--v3-red)] transition hover:bg-[var(--v3-red)]/10">
            <span className="material-symbols-outlined text-xl">delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ── Uncategorized Card ────────────────────────────────────── */
function UncategorizedCard({
  tx, onChangeCategory, onSaveRule,
}: {
  tx: Transaction;
  onChangeCategory: (cat: CategoryName) => void;
  onSaveRule: (cat: CategoryName) => void;
}) {
  const [selectedCat, setSelectedCat] = useState<CategoryName>("Other");
  const [saveRule, setSaveRule] = useState(false);

  function handleCategorySelect(cat: CategoryName) {
    setSelectedCat(cat);
    onChangeCategory(cat);
    if (saveRule && cat !== "Other") {
      onSaveRule(cat);
    }
  }

  return (
    <div className="p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group"
      style={{ backgroundColor: "var(--v3-card)", border: "1px solid var(--v3-border)" }}>
      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0 flex-1">
          <h4 className="font-bold truncate" style={{ color: "var(--v3-text)" }}>{tx.description}</h4>
          <p className="text-sm mt-0.5" style={{ color: "var(--v3-text-muted)" }}>
            {tx.date} &bull; {formatNOK(tx.amount)}
          </p>
        </div>
        <span className="material-symbols-outlined text-xl shrink-0 ml-3 transition-colors"
          style={{ color: "var(--v3-surface-highest)" }}>
          {tx.amount >= 0 ? "payments" : "shopping_bag"}
        </span>
      </div>
      <div className="space-y-3">
        <select value={selectedCat} onChange={(e) => handleCategorySelect(e.target.value as CategoryName)}
          className="w-full rounded-lg text-sm font-medium p-3 border-none focus:ring-2 transition-all"
          style={{ backgroundColor: "var(--v3-surface-low)", color: "var(--v3-text)" }}>
          <option value="Other">Select Category</option>
          {CATEGORIES.filter((c) => c.name !== "Other").map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
        <div className="flex items-center justify-between py-1">
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--v3-text-muted)" }}>
            Save as Auto-Rule
          </label>
          <button onClick={() => setSaveRule(!saveRule)}
            className="w-10 h-6 rounded-full relative p-1 transition-colors"
            style={{ backgroundColor: saveRule ? "var(--v3-primary)" : "var(--v3-surface-highest)" }}>
            <div className="w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
              style={{ transform: saveRule ? "translateX(16px)" : "translateX(0)" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Suggestion Card ───────────────────────────────────────── */
function SuggestionCard({
  tx, onConfirm, onChangeCategory,
}: {
  tx: Transaction;
  onConfirm: () => void;
  onChangeCategory: (cat: CategoryName) => void;
}) {
  void categoryMap[tx.category];
  return (
    <div className="p-6 rounded-xl" style={{ backgroundColor: "var(--v3-surface-low)", border: "1px solid color-mix(in srgb, var(--v3-secondary) 10%, transparent)" }}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-sm truncate" style={{ color: "var(--v3-text)" }}>{tx.description}</h4>
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shrink-0 ml-2"
          style={{ backgroundColor: "var(--v3-secondary-container)", color: "var(--v3-secondary)" }}>
          Suggestion
        </span>
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--v3-text-muted)" }}>
        Did you mean <span className="font-bold underline" style={{ color: "var(--v3-secondary)" }}>&apos;{tx.category}&apos;</span>?
        <span className="block text-xs mt-1">{tx.date} &bull; {formatNOK(tx.amount)}</span>
      </p>
      <div className="flex gap-2">
        <button onClick={onConfirm}
          className="flex-1 py-2 rounded-lg font-bold text-sm text-white transition-colors"
          style={{ backgroundColor: "var(--v3-primary)" }}>
          Confirm
        </button>
        <CategoryBadge category={tx.category} editable onChange={onChangeCategory} />
      </div>
    </div>
  );
}

/* ── Duplicate Comparison Card ─────────────────────────────── */
function DuplicateCard({
  group, onKeep, onDiscard,
}: {
  group: { key: string; transactions: Transaction[] };
  onKeep: (id: string) => void;
  onDiscard: (id: string) => void;
}) {
  const [a, b] = group.transactions;
  if (!a || !b) return null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--v3-surface-low)" }}>
      <div className="flex items-center justify-between p-4" style={{ backgroundColor: "color-mix(in srgb, var(--v3-card) 40%, transparent)" }}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--v3-text-muted)" }}>
          {a.description.slice(0, 30)}
        </span>
        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: "var(--v3-red-container)", color: "var(--v3-red)" }}>
          Potential Duplicate
        </span>
      </div>
      <div className="flex divide-x" style={{ borderColor: "var(--v3-border)" }}>
        {/* Transaction A */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-tighter mb-1" style={{ color: "var(--v3-text-muted)" }}>Transaction A</p>
            <p className="text-2xl font-black" style={{ color: "var(--v3-text)" }}>{formatNOK(a.amount)}</p>
            <p className="text-sm mt-1" style={{ color: "var(--v3-text-muted)" }}>{a.date}</p>
          </div>
          <button onClick={() => onKeep(a.id)}
            className="mt-4 w-full py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--v3-primary)" }}>
            Keep This
          </button>
        </div>
        {/* Transaction B */}
        <div className="flex-1 p-5 flex flex-col justify-between" style={{ backgroundColor: "color-mix(in srgb, var(--v3-red-container) 10%, transparent)" }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-tighter mb-1" style={{ color: "var(--v3-text-muted)" }}>Transaction B</p>
            <p className="text-2xl font-black" style={{ color: "var(--v3-text)" }}>{formatNOK(b.amount)}</p>
            <p className="text-sm mt-1" style={{ color: "var(--v3-text-muted)" }}>{b.date}</p>
          </div>
          <button onClick={() => onDiscard(b.id)}
            className="mt-4 w-full py-2 rounded-lg text-sm font-bold transition-colors"
            style={{ color: "var(--v3-red)", backgroundColor: "var(--v3-card)", border: "1px solid color-mix(in srgb, var(--v3-red) 20%, transparent)" }}>
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
