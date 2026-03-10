"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { AddTransactionForm } from "@/components/transactions/AddTransactionForm";
import {
  useTransactions,
  type TransactionFilters as Filters,
} from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";

export default function TransactionsPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const { data: transactions, totalCount, isLoading, mutate } = useTransactions(filters, page);
  const { names: categoryNames } = useCategories();
  const { accounts } = useAccounts();

  function handleFiltersChange(newFilters: Filters) {
    setFilters(newFilters);
    setPage(0);
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Transactions</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {showForm ? "Hide form" : "Add transaction"}
          </button>
        </div>

        {showForm && (
          <div className="mb-4">
            <AddTransactionForm
              categories={categoryNames}
              accounts={accounts}
              onAdded={() => mutate()}
            />
          </div>
        )}

        <div className="mb-4">
          <TransactionFilters
            filters={filters}
            onChange={handleFiltersChange}
            categories={categoryNames}
          />
        </div>

        <TransactionTable
          transactions={transactions}
          totalCount={totalCount}
          page={page}
          onPageChange={setPage}
          isLoading={isLoading}
          onUpdate={() => mutate()}
          categories={categoryNames}
        />
      </main>
    </div>
  );
}
