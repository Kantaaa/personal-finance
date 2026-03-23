"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { seedDemoData, clearDemoData } from "@/app/v3/lib/seed";

const NAV_ITEMS = [
  { href: "/v3", label: "Dashboard", icon: "dashboard", mobileLabel: "Home" },
  { href: "/v3/budget", label: "Budget Planner", icon: "payments", mobileLabel: "Budget" },
  { href: "/v3/transactions", label: "Transactions", icon: "upload_file", mobileLabel: "Trans" },
  { href: "/v3/review", label: "Monthly Review", icon: "group", mobileLabel: "Review" },
  { href: "/v3/history", label: "Historical Trends", icon: "inventory_2", mobileLabel: "History" },
];

const DARK_KEY = "pf-v3-dark";

export default function V3Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(localStorage.getItem(DARK_KEY) === "true");
  }, []);

  function toggleDark() {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem(DARK_KEY, String(next));
      return next;
    });
  }

  function isActive(href: string) {
    if (href === "/v3") return pathname === "/v3";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@600;700;800&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .v3 {
          font-family: 'Inter', sans-serif;
          --v3-bg: #f7f9ff;
          --v3-surface-low: #f1f4fa;
          --v3-card: #ffffff;
          --v3-surface-high: #e5e8ee;
          --v3-surface-highest: #dfe3e8;
          --v3-text: #181c20;
          --v3-text-muted: #3e4948;
          --v3-primary: #005050;
          --v3-primary-alt: #006a6a;
          --v3-green: #005315;
          --v3-green-light: #9af897;
          --v3-green-dim: #7edb7e;
          --v3-red: #ba1a1a;
          --v3-red-container: #ffdad6;
          --v3-red-on-container: #93000a;
          --v3-border: #bec9c8;
          --v3-outline: #6e7979;
          --v3-secondary: #326576;
          --v3-secondary-container: #b5e7fb;
          --v3-inverse: #2d3135;
          --v3-inverse-text: #eef1f7;
          --v3-gradient-from: #005050;
          --v3-gradient-to: #006a6a;
          --v3-input-bg: #ffffff;
        }
        .v3.dark {
          --v3-bg: #111318;
          --v3-surface-low: #1a1c20;
          --v3-card: #1e2024;
          --v3-surface-high: #282a2e;
          --v3-surface-highest: #333538;
          --v3-text: #e2e3e8;
          --v3-text-muted: #9a9b9f;
          --v3-primary: #84d4d3;
          --v3-primary-alt: #5fbfbe;
          --v3-green: #7edb7e;
          --v3-green-light: #026e1f;
          --v3-green-dim: #4caf4c;
          --v3-red: #ffb4ab;
          --v3-red-container: #93000a;
          --v3-red-on-container: #ffdad6;
          --v3-border: #3e4948;
          --v3-outline: #8e9192;
          --v3-secondary: #9ccee2;
          --v3-secondary-container: #154d5d;
          --v3-inverse: #eef1f7;
          --v3-inverse-text: #2d3135;
          --v3-gradient-from: #003838;
          --v3-gradient-to: #004f4f;
          --v3-input-bg: #1a1c20;
        }
        .v3 h1, .v3 h2, .v3 h3, .v3 .font-headline { font-family: 'Manrope', sans-serif; }
        .v3 .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          display: inline-block;
          line-height: 1;
          vertical-align: middle;
        }
        .v3 .fill-icon { font-variation-settings: 'FILL' 1; }
        .v3 .premium-gradient {
          background: linear-gradient(135deg, var(--v3-gradient-from) 0%, var(--v3-gradient-to) 100%);
        }
      `}</style>

      <div className={`v3 ${mounted && dark ? "dark" : ""} antialiased flex overflow-hidden min-h-screen`} style={{ backgroundColor: "var(--v3-bg)", color: "var(--v3-text)" }}>
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 p-4 gap-y-2 z-50 font-[Manrope] text-sm font-medium" style={{ backgroundColor: "var(--v3-surface-low)" }}>
          <div className="flex items-center gap-3 px-2 py-4 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: "var(--v3-primary)" }}>
              <span className="material-symbols-outlined">account_balance</span>
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tighter" style={{ color: "var(--v3-primary-alt)" }}>The Atelier</div>
              <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--v3-text-muted)" }}>Budget Planner</div>
            </div>
          </div>

          <nav className="flex-grow space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 font-medium"
                style={
                  isActive(item.href)
                    ? { backgroundColor: "var(--v3-card)", color: "var(--v3-primary-alt)", fontWeight: 700, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                    : { color: "var(--v3-text-muted)" }
                }
              >
                <span
                  className="material-symbols-outlined"
                  style={isActive(item.href) ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto space-y-1 pt-4" style={{ borderTop: "1px solid var(--v3-border)" }}>
            {/* Demo data controls */}
            <div className="flex gap-1 px-2 mb-2">
              <button
                onClick={() => { seedDemoData(); router.refresh(); window.location.reload(); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-bold transition-colors"
                style={{ backgroundColor: "var(--v3-surface-high)", color: "var(--v3-primary)" }}
                title="Load demo data"
              >
                <span className="material-symbols-outlined text-[14px]">science</span>
                Load Demo
              </button>
              <button
                onClick={() => { clearDemoData(); router.refresh(); window.location.reload(); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-bold transition-colors"
                style={{ backgroundColor: "var(--v3-surface-high)", color: "var(--v3-red)" }}
                title="Clear all data"
              >
                <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
                Clear All
              </button>
            </div>
            <Link
              href="/v3"
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 font-medium"
              style={{ color: "var(--v3-text-muted)" }}
            >
              <span className="material-symbols-outlined">help</span>
              Help
            </Link>
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 font-medium"
              style={{ color: "var(--v3-text-muted)" }}
            >
              <span className="material-symbols-outlined">logout</span>
              Exit v3
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-grow md:ml-64 min-h-screen pb-20 md:pb-0">
          {/* Top App Bar */}
          <header className="w-full h-16 sticky top-0 z-40 backdrop-blur-md shadow-sm flex items-center justify-between px-6 font-[Manrope] antialiased tracking-tight" style={{ backgroundColor: "color-mix(in srgb, var(--v3-bg) 80%, transparent)" }}>
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold tracking-tighter" style={{ color: "var(--v3-primary-alt)" }}>
                {NAV_ITEMS.find((n) => isActive(n.href))?.label ?? "The Fiscal Atelier"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDark}
                className="p-2 rounded-full transition-colors"
                style={{ color: "var(--v3-text-muted)" }}
                title={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                <span className="material-symbols-outlined">
                  {dark ? "light_mode" : "dark_mode"}
                </span>
              </button>
              <button className="p-2 rounded-full transition-colors" style={{ color: "var(--v3-text-muted)" }}>
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="p-2 rounded-full transition-colors" style={{ color: "var(--v3-text-muted)" }}>
                <span className="material-symbols-outlined">settings</span>
              </button>
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "var(--v3-primary)" }}>
                U
              </div>
            </div>
          </header>

          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 flex items-center justify-around px-2 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]" style={{ backgroundColor: "var(--v3-card)" }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1"
              style={{ color: isActive(item.href) ? "var(--v3-primary)" : "var(--v3-text-muted)" }}
            >
              <span
                className="material-symbols-outlined"
                style={isActive(item.href) ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-bold">{item.mobileLabel}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
