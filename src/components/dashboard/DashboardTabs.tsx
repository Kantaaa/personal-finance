"use client";

export type DashboardTab = "overview" | "trends" | "details";

interface DashboardTabsProps {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}

const TABS: { value: DashboardTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "trends", label: "Trends" },
  { value: "details", label: "Details" },
];

export function DashboardTabs({ active, onChange }: DashboardTabsProps) {
  return (
    <div className="flex rounded-md border">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 py-1.5 text-sm font-medium transition-colors ${
            active === tab.value
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
