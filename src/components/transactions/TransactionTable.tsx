"use client";

import { useState } from "react";
import Link from "next/link";
import type { Transaction } from "@/hooks/useTransactions";
import { updateTransaction, deleteTransaction, bulkUpdateCategory, bulkDeleteTransactions, PAGE_SIZE } from "@/hooks/useTransactions";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TransactionTableProps {
  transactions: Transaction[];
  totalCount: number;
  page: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  onUpdate?: () => void;
  categories: string[];
}

interface EditState {
  date: string;
  amount: string;
  description: string;
  category: string;
}

export function TransactionTable({
  transactions,
  totalCount,
  page,
  onPageChange,
  isLoading,
  onUpdate,
  categories,
}: TransactionTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    date: "",
    amount: "",
    description: "",
    category: "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const allSelected = transactions.length > 0 && selectedIds.size === transactions.length;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  }

  async function handleBulkApply() {
    if (!bulkCategory || selectedIds.size === 0) return;
    setBulkSaving(true);
    await bulkUpdateCategory([...selectedIds], bulkCategory);
    setSelectedIds(new Set());
    setBulkCategory("");
    setBulkSaving(false);
    onUpdate?.();
  }

  async function handleBulkDelete() {
    if (!confirmBulkDelete) {
      setConfirmBulkDelete(true);
      return;
    }
    setBulkDeleting(true);
    await bulkDeleteTransactions([...selectedIds]);
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
    setBulkDeleting(false);
    onUpdate?.();
  }

  function startEdit(t: Transaction) {
    setEditingId(t.id);
    setDeletingId(null);
    setEditState({
      date: t.date,
      amount: String(t.amount),
      description: t.description ?? "",
      category: t.category,
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    await updateTransaction(id, {
      date: editState.date,
      amount: parseFloat(editState.amount),
      description: editState.description,
      category: editState.category,
    });
    setEditingId(null);
    setSaving(false);
    onUpdate?.();
  }

  async function handleDelete(id: string) {
    if (deletingId === id) {
      await deleteTransaction(id);
      setDeletingId(null);
      onUpdate?.();
    } else {
      setDeletingId(id);
      setEditingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded border bg-card" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0 && totalCount === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-lg font-medium">No transactions yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by uploading a CSV or adding a transaction manually.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link
            href="/upload"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Upload CSV
          </Link>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const rangeStart = page * PAGE_SIZE + 1;
  const rangeEnd = Math.min((page + 1) * PAGE_SIZE, totalCount);

  return (
    <div>
      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border bg-primary/5 px-4 py-2">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <select
            value={bulkCategory}
            onChange={(e) => setBulkCategory(e.target.value)}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          >
            <option value="">Assign category...</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={handleBulkApply}
            disabled={!bulkCategory || bulkSaving}
            className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {bulkSaving ? "Applying..." : "Apply"}
          </button>
          <span className="mx-2 text-muted-foreground">|</span>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              confirmBulkDelete
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "border text-destructive hover:bg-destructive/10"
            } disabled:opacity-50`}
          >
            {bulkDeleting
              ? "Deleting..."
              : confirmBulkDelete
                ? `Confirm delete ${selectedIds.size}?`
                : "Delete"}
          </button>
          <button
            onClick={() => { setSelectedIds(new Set()); setConfirmBulkDelete(false); }}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-3 py-2 text-left font-medium">Date</th>
              <th className="px-3 py-2 text-left font-medium">Description</th>
              <th className="px-3 py-2 text-left font-medium">Category</th>
              <th className="px-3 py-2 text-right font-medium">Amount</th>
              <th className="px-3 py-2 text-left font-medium">Source</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) =>
              editingId === t.id ? (
                <tr key={t.id} className="border-b bg-muted/20">
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={editState.date}
                      onChange={(e) =>
                        setEditState((s) => ({ ...s, date: e.target.value }))
                      }
                      className="w-full rounded border bg-background px-1.5 py-1 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={editState.description}
                      onChange={(e) =>
                        setEditState((s) => ({
                          ...s,
                          description: e.target.value,
                        }))
                      }
                      className="w-full rounded border bg-background px-1.5 py-1 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={editState.category}
                      onChange={(e) =>
                        setEditState((s) => ({
                          ...s,
                          category: e.target.value,
                        }))
                      }
                      className="w-full rounded border bg-background px-1.5 py-1 text-sm"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={editState.amount}
                      onChange={(e) =>
                        setEditState((s) => ({ ...s, amount: e.target.value }))
                      }
                      className="w-full rounded border bg-background px-1.5 py-1 text-right text-sm font-mono"
                    />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {t.source_raw?.split(":")[0] ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button
                      onClick={() => saveEdit(t.id)}
                      disabled={saving}
                      className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="ml-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr
                  key={t.id}
                  className={`border-b last:border-0 hover:bg-muted/30 ${
                    selectedIds.has(t.id) ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(t.id)}
                      onChange={() => toggleSelect(t.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatDate(t.date)}
                  </td>
                  <td className="px-3 py-2">
                    {t.merchant || t.description || "—"}
                  </td>
                  <td className="px-3 py-2">{t.category}</td>
                  <td
                    className={`whitespace-nowrap px-3 py-2 text-right font-mono ${
                      t.amount >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {t.amount >= 0 ? "+" : ""}
                    {formatCurrency(t.amount, t.currency)}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {t.source_raw?.split(":")[0] ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button
                      onClick={() => startEdit(t)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      onBlur={() => {
                        if (deletingId === t.id) setDeletingId(null);
                      }}
                      className={`ml-2 text-xs ${
                        deletingId === t.id
                          ? "font-medium text-destructive"
                          : "text-muted-foreground hover:text-destructive"
                      }`}
                      title={
                        deletingId === t.id
                          ? "Click again to confirm"
                          : "Delete transaction"
                      }
                    >
                      {deletingId === t.id ? "Confirm?" : "Delete"}
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {rangeStart}–{rangeEnd} of {totalCount}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 hover:bg-muted"
            >
              Previous
            </button>
            <span className="flex items-center px-2 text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 hover:bg-muted"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
