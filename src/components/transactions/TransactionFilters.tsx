"use client";

import type { TransactionFilters as Filters } from "@/hooks/useTransactions";

interface TransactionFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  categories: string[];
}

export function TransactionFilters({
  filters,
  onChange,
  categories,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex-1 min-w-[200px]">
        <label className="mb-1 block text-xs text-muted-foreground">Search</label>
        <input
          type="text"
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
          placeholder="Search description or merchant..."
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">From</label>
        <input
          type="date"
          value={filters.from ?? ""}
          onChange={(e) => onChange({ ...filters, from: e.target.value || undefined })}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">To</label>
        <input
          type="date"
          value={filters.to ?? ""}
          onChange={(e) => onChange({ ...filters, to: e.target.value || undefined })}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">
          Category
        </label>
        <select
          value={filters.category ?? "All"}
          onChange={(e) =>
            onChange({
              ...filters,
              category: e.target.value === "All" ? undefined : e.target.value,
            })
          }
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          <option value="All">All</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">
          Source
        </label>
        <select
          value={filters.source ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              source: e.target.value || undefined,
            })
          }
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          <option value="">All</option>
          <option value="sparebanken">Sparebanken</option>
          <option value="curve">Curve</option>
          <option value="trumf">Trumf</option>
        </select>
      </div>
    </div>
  );
}
