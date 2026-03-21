"use client";

import { useState, useMemo } from "react";
import {
  useV3Store,
  formatNOK,
  CATEGORIES,
  type CategoryName,
  type Transaction,
} from "@/app/v3/lib/store";

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const categoryMap = Object.fromEntries(
  CATEGORIES.map((c) => [c.name, c])
) as Record<CategoryName, (typeof CATEGORIES)[number]>;

// ---------------------------------------------------------------------------
// Category pill badge
// ---------------------------------------------------------------------------
function CategoryBadge({ category }: { category: CategoryName }) {
  const cat = categoryMap[category];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--v3-secondary-container)] px-3 py-1 text-xs font-medium text-[var(--v3-secondary)]">
      <span className="material-symbols-outlined text-sm">{cat?.icon ?? "label"}</span>
      {category}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function TransactionsPage() {
  const { data, loaded, addTransaction, updateTransaction, deleteTransaction } =
    useV3Store();

  // Form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryName>(CATEGORIES[0].name);
  const [date, setDate] = useState(todayString);

  // Table state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved">("all");

  const transactions = data.transactions;

  const filtered = useMemo(() => {
    if (filterStatus === "all") return transactions;
    return transactions.filter((t) => t.status === filterStatus);
  }, [transactions, filterStatus]);

  // Handlers ---------------------------------------------------------------

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

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((t) => t.id)));
    }
  }

  function approveAll() {
    filtered
      .filter((t) => t.status === "pending")
      .forEach((t) => updateTransaction(t.id, { status: "approved" }));
  }

  function bulkDelete() {
    selected.forEach((id) => deleteTransaction(id));
    setSelected(new Set());
  }

  // Loading spinner --------------------------------------------------------
  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-[var(--v3-primary)]">
          progress_activity
        </span>
      </div>
    );
  }

  const pendingCount = transactions.filter((t) => t.status === "pending").length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10">
      {/* ================================================================= */}
      {/* 1. Hero Header                                                    */}
      {/* ================================================================= */}
      <section>
        <h1 className="font-[Manrope] text-3xl font-bold text-[var(--v3-text)]">
          Transaction Import
        </h1>
        <p className="mt-2 text-sm text-[var(--v3-text-muted)]">
          Manually add transactions, review them, and approve before they count
          toward your budget.
        </p>
      </section>

      {/* ================================================================= */}
      {/* 2. Add Transaction Form + Tips                                    */}
      {/* ================================================================= */}
      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ---- Form card ---- */}
        <div className="rounded-2xl border border-[var(--v3-border)] bg-[var(--v3-card)] p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--v3-primary)]">
              add_circle
            </span>
            <h2 className="font-[Manrope] text-lg font-semibold text-[var(--v3-text)]">
              Add Transaction
            </h2>
          </div>

          {/* Upload-zone-styled area */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl border-2 border-dashed border-[var(--v3-border)] bg-[var(--v3-surface-low)] p-6 space-y-4">
              {/* Description */}
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--v3-text-muted)]">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. REMA 1000, Netflix, Salary..."
                  className="w-full rounded-lg border border-[var(--v3-border)] bg-[var(--v3-card)] px-3 py-2 text-sm text-[var(--v3-text)] placeholder:text-[var(--v3-text-muted)]/50 focus:border-[var(--v3-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--v3-primary)]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Amount */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--v3-text-muted)]">
                    Amount (NOK)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="-450"
                    className="w-full rounded-lg border border-[var(--v3-border)] bg-[var(--v3-card)] px-3 py-2 text-sm text-[var(--v3-text)] placeholder:text-[var(--v3-text-muted)]/50 focus:border-[var(--v3-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--v3-primary)]"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--v3-text-muted)]">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryName)}
                    className="w-full rounded-lg border border-[var(--v3-border)] bg-[var(--v3-card)] px-3 py-2 text-sm text-[var(--v3-text)] focus:border-[var(--v3-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--v3-primary)]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--v3-text-muted)]">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-[var(--v3-border)] bg-[var(--v3-card)] px-3 py-2 text-sm text-[var(--v3-text)] focus:border-[var(--v3-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--v3-primary)]"
                  />
                </div>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--v3-gradient-from)] to-[var(--v3-gradient-to)] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Add Transaction
            </button>
          </form>
        </div>

        {/* ---- Tips sidebar ---- */}
        <div className="rounded-2xl border border-[var(--v3-border)] bg-[var(--v3-surface-low)] p-6 shadow-sm h-fit">
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--v3-primary)]">info</span>
            <h3 className="font-[Manrope] text-sm font-semibold text-[var(--v3-text)]">
              Input Guidelines
            </h3>
          </div>
          <ul className="space-y-3 text-xs text-[var(--v3-text-muted)] leading-relaxed">
            <li className="flex gap-2">
              <span className="material-symbols-outlined text-sm text-[var(--v3-primary)]">
                remove
              </span>
              <span>
                Use <strong>negative</strong> amounts for expenses (e.g. -350).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="material-symbols-outlined text-sm text-[var(--v3-green)]">
                add
              </span>
              <span>
                Use <strong>positive</strong> amounts for income (e.g. 35000).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="material-symbols-outlined text-sm text-[var(--v3-primary)]">
                category
              </span>
              <span>
                Pick the closest category &mdash; you can change it later in the
                review table.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="material-symbols-outlined text-sm text-[var(--v3-primary)]">
                check_circle
              </span>
              <span>
                Transactions start as <strong>Pending</strong>. Approve them once
                you&rsquo;ve verified the details.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. Transaction Table                                               */}
      {/* ================================================================= */}
      <section className="rounded-2xl border border-[var(--v3-border)] bg-[var(--v3-card)] shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--v3-surface-high)] px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="font-[Manrope] text-lg font-semibold text-[var(--v3-text)]">
              Review Queue
            </h2>
            {pendingCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-[var(--v3-primary-alt)] px-2.5 py-0.5 text-xs font-medium text-white">
                {pendingCount} pending
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as "all" | "pending" | "approved")
              }
              className="rounded-lg border border-[var(--v3-border)] bg-[var(--v3-card)] px-3 py-1.5 text-xs text-[var(--v3-text)] focus:border-[var(--v3-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--v3-primary)]"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>

            {/* Approve all */}
            <button
              onClick={approveAll}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--v3-primary)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--v3-primary-alt)]"
            >
              <span className="material-symbols-outlined text-sm">
                done_all
              </span>
              Approve All
            </button>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--v3-text-muted)]">
            <span className="material-symbols-outlined mb-2 text-4xl opacity-40">
              receipt_long
            </span>
            <p className="text-sm">No transactions yet. Add one above!</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--v3-surface-high)] bg-[var(--v3-surface-low)] text-xs font-medium uppercase tracking-wide text-[var(--v3-text-muted)]">
                    <th className="w-10 px-6 py-3">
                      <input
                        type="checkbox"
                        checked={
                          filtered.length > 0 &&
                          selected.size === filtered.length
                        }
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-[var(--v3-border)] text-[var(--v3-primary)] accent-[var(--v3-primary)]"
                      />
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
                      key={tx.id}
                      tx={tx}
                      isSelected={selected.has(tx.id)}
                      onToggle={() => toggleSelect(tx.id)}
                      onApprove={() =>
                        updateTransaction(tx.id, { status: "approved" })
                      }
                      onDelete={() => {
                        deleteTransaction(tx.id);
                        setSelected((prev) => {
                          const next = new Set(prev);
                          next.delete(tx.id);
                          return next;
                        });
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination text */}
            <div className="border-t border-[var(--v3-surface-high)] px-6 py-3">
              <p className="text-xs text-[var(--v3-text-muted)]">
                Showing {filtered.length} of {transactions.length}
              </p>
            </div>
          </>
        )}
      </section>

      {/* ================================================================= */}
      {/* 4. Floating Bulk Action Bar                                        */}
      {/* ================================================================= */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-50 mx-auto flex w-fit items-center gap-4 rounded-2xl bg-[var(--v3-inverse)] px-6 py-3 text-white shadow-2xl">
          <span className="text-sm font-medium">
            {selected.size} selected
          </span>
          <div className="h-5 w-px bg-white/20" />
          <button
            onClick={() => {
              selected.forEach((id) =>
                updateTransaction(id, { status: "approved" })
              );
              setSelected(new Set());
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium transition hover:bg-white/20"
          >
            <span className="material-symbols-outlined text-sm">
              check_circle
            </span>
            Approve
          </button>
          <button
            onClick={bulkDelete}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--v3-red)] px-3 py-1.5 text-xs font-medium transition hover:bg-[var(--v3-red)]/80"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transaction row component
// ---------------------------------------------------------------------------
function TransactionRow({
  tx,
  isSelected,
  onToggle,
  onApprove,
  onDelete,
}: {
  tx: Transaction;
  isSelected: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onDelete: () => void;
}) {
  const isIncome = tx.amount >= 0;
  return (
    <tr className="group border-b border-[var(--v3-surface-high)] transition hover:bg-[var(--v3-surface-low)]">
      {/* Checkbox */}
      <td className="px-6 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="h-4 w-4 rounded border-[var(--v3-border)] accent-[var(--v3-primary)]"
        />
      </td>

      {/* Description + date */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="font-medium text-[var(--v3-text)]">{tx.description}</p>
            <p className="text-xs text-[var(--v3-text-muted)]">{tx.date}</p>
          </div>
          {tx.status === "pending" && (
            <span className="rounded-full bg-[var(--v3-surface-highest)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--v3-text-muted)]">
              Pending
            </span>
          )}
          {tx.status === "approved" && (
            <span className="rounded-full bg-[var(--v3-green-dim)]/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--v3-green)]">
              Approved
            </span>
          )}
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3">
        <CategoryBadge category={tx.category} />
      </td>

      {/* Amount */}
      <td className="px-4 py-3 text-right font-semibold tabular-nums">
        <span className={isIncome ? "text-[var(--v3-green)]" : "text-[var(--v3-red)]"}>
          {formatNOK(tx.amount)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1 opacity-0 transition group-hover:opacity-100">
          {tx.status === "pending" && (
            <button
              onClick={onApprove}
              title="Approve"
              className="rounded-lg p-1 text-[var(--v3-primary)] transition hover:bg-[var(--v3-primary)]/10"
            >
              <span className="material-symbols-outlined text-xl">
                check_circle
              </span>
            </button>
          )}
          <button
            onClick={onDelete}
            title="Delete"
            className="rounded-lg p-1 text-[var(--v3-red)] transition hover:bg-[var(--v3-red)]/10"
          >
            <span className="material-symbols-outlined text-xl">delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
