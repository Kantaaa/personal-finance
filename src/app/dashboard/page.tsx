"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { DashboardTabs, type DashboardTab } from "@/components/dashboard/DashboardTabs";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { MonthlyTrend } from "@/components/dashboard/MonthlyTrend";
import { CategoryTable } from "@/components/dashboard/CategoryTable";
import { BudgetVsActual } from "@/components/dashboard/BudgetVsActual";
import { UpcomingExpenses } from "@/components/dashboard/UpcomingExpenses";
import { useSummary, type PeriodType } from "@/hooks/useSummary";
import { useMonthlyTrend } from "@/hooks/useMonthlyTrend";
import { useBudgets } from "@/hooks/useBudgets";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [period, setPeriod] = useState<PeriodType>("month");
  const [refDate, setRefDate] = useState(() => new Date());

  const { data: summary, isLoading: summaryLoading } = useSummary(period, refDate);
  const { data: trend, isLoading: trendLoading } = useMonthlyTrend();
  const { byCategory: budgetByCategory, isLoading: budgetLoading } = useBudgets();
  const { data: transactions, totalCount, isLoading: txLoading } = useTransactions({});
  const { accounts, isLoading: accLoading } = useAccounts();

  // Redirect to onboarding if user has no transactions and no accounts
  useEffect(() => {
    if (!txLoading && !accLoading && totalCount === 0 && accounts.length === 0) {
      router.push("/onboarding");
    }
  }, [txLoading, accLoading, totalCount, accounts.length, router]);

  const isEmpty = !txLoading && totalCount === 0;

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <DashboardTabs active={tab} onChange={setTab} />
        </div>

        {/* Empty state */}
        {isEmpty && (
          <div className="rounded-lg border bg-card p-8 text-center mb-6">
            <p className="text-lg font-medium">No data yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload transactions or add one manually to see your dashboard.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                href="/upload"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Upload CSV
              </Link>
              <Link
                href="/transactions"
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Add manually
              </Link>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="space-y-6">
            <SummaryCards summary={summary} isLoading={summaryLoading} />
            <UpcomingExpenses />
            <BudgetVsActual
              summary={summary}
              budgetByCategory={budgetByCategory}
              isLoading={summaryLoading || budgetLoading}
            />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <CategoryBreakdown summary={summary} isLoading={summaryLoading} />
              <RecentTransactions />
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {tab === "trends" && (
          <div className="space-y-6">
            <MonthlyTrend data={trend} isLoading={trendLoading} />
            <CategoryTable data={trend} isLoading={trendLoading} />
          </div>
        )}

        {/* Details Tab */}
        {tab === "details" && (
          <div className="space-y-6">
            <PeriodSelector
              period={period}
              refDate={refDate}
              onChange={setPeriod}
              onDateChange={setRefDate}
            />
            <SummaryCards summary={summary} isLoading={summaryLoading} />
            <SpendingChart summary={summary} isLoading={summaryLoading} />
            <CategoryBreakdown summary={summary} isLoading={summaryLoading} />
          </div>
        )}
      </main>
    </div>
  );
}
