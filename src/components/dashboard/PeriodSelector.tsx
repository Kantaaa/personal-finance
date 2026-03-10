"use client";

import type { PeriodType } from "@/hooks/useSummary";

const PERIODS: { value: PeriodType; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

interface PeriodSelectorProps {
  period: PeriodType;
  refDate: Date;
  onChange: (period: PeriodType) => void;
  onDateChange: (date: Date) => void;
}

export function PeriodSelector({
  period,
  refDate,
  onChange,
  onDateChange,
}: PeriodSelectorProps) {
  function navigate(direction: -1 | 1) {
    const d = new Date(refDate);
    switch (period) {
      case "week":
        d.setDate(d.getDate() + direction * 7);
        break;
      case "month":
        d.setMonth(d.getMonth() + direction);
        break;
      case "year":
        d.setFullYear(d.getFullYear() + direction);
        break;
    }
    onDateChange(d);
  }

  function label() {
    const opts: Intl.DateTimeFormatOptions =
      period === "year"
        ? { year: "numeric" }
        : period === "month"
          ? { year: "numeric", month: "long" }
          : { year: "numeric", month: "short", day: "numeric" };
    return new Intl.DateTimeFormat("en", opts).format(refDate);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex rounded-md border">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              period === p.value
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate(-1)}
          className="rounded px-2 py-1 text-sm hover:bg-muted"
        >
          &larr;
        </button>
        <span className="min-w-[140px] text-center text-sm font-medium">
          {label()}
        </span>
        <button
          onClick={() => navigate(1)}
          className="rounded px-2 py-1 text-sm hover:bg-muted"
        >
          &rarr;
        </button>
      </div>
    </div>
  );
}
