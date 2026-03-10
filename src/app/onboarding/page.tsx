"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { useBudgets } from "@/hooks/useBudgets";

type Step = "welcome" | "account" | "import" | "categories" | "budget" | "done";
const STEPS: Step[] = ["welcome", "account", "import", "categories", "budget", "done"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const { categories, addCategory, deleteCategory, mutate: mutateCats } = useCategories();
  const { createAccount } = useAccounts();
  const { setBudget } = useBudgets();

  // Account step state
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState("bank");
  const [accProvider, setAccProvider] = useState("sparebanken");

  // Import step state
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState("sparebanken");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);

  // Manual transaction state
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualAmount, setManualAmount] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualSaving, setManualSaving] = useState(false);

  // New category state
  const [newCat, setNewCat] = useState("");

  // Budget step state
  const [budgetCat, setBudgetCat] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  const currentIndex = STEPS.indexOf(step);
  const progress = ((currentIndex) / (STEPS.length - 1)) * 100;

  function next() {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
  }

  function goToDashboard() {
    router.push("/dashboard");
  }

  async function handleCreateAccount() {
    if (!accName.trim()) return;
    await createAccount(accName.trim(), accType, accProvider);
    next();
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("source", source);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok) {
      setUploadResult(`Imported ${data.inserted} transactions.`);
    } else {
      setUploadResult(`Error: ${data.error}`);
    }
    setUploading(false);
  }

  async function handleManualTransaction() {
    if (!manualAmount || !manualDesc) return;
    setManualSaving(true);
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("transactions").insert({
        user_id: user.id,
        date: manualDate,
        amount: parseFloat(manualAmount),
        description: manualDesc,
        category: "Other",
        source_raw: "manual",
      });
      setUploadResult("Transaction added!");
      setManualAmount("");
      setManualDesc("");
    }
    setManualSaving(false);
  }

  async function handleAddCategory() {
    if (!newCat.trim()) return;
    await addCategory(newCat.trim());
    setNewCat("");
  }

  async function handleSetBudget() {
    if (!budgetCat || !budgetAmount) return;
    await setBudget(budgetCat, parseFloat(budgetAmount));
    setBudgetAmount("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress bar */}
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step content */}
        <div className="rounded-lg border bg-card p-6">
          {step === "welcome" && (
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold">Welcome to Finance!</h1>
              <p className="text-muted-foreground">
                Let&apos;s set up your personal finances in a few quick steps. You can skip any step
                and come back later.
              </p>
              <ul className="text-sm text-left text-muted-foreground space-y-1 mx-auto max-w-xs">
                <li>1. Create a bank account</li>
                <li>2. Import or add transactions</li>
                <li>3. Review categories</li>
                <li>4. Set a budget</li>
              </ul>
              <button
                onClick={next}
                className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Get started
              </button>
            </div>
          )}

          {step === "account" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Create your first account</h2>
              <p className="text-sm text-muted-foreground">
                Add a bank or card account to organize your transactions.
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="Account name (e.g. Main checking)"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value)}
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="bank">Bank</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                  <select
                    value={accProvider}
                    onChange={(e) => setAccProvider(e.target.value)}
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="sparebanken">Sparebanken</option>
                    <option value="curve">Curve</option>
                    <option value="trumf">Trumf</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button
                  onClick={handleCreateAccount}
                  disabled={!accName.trim()}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Create account
                </button>
              </div>
            </div>
          )}

          {step === "import" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Import transactions</h2>
              <p className="text-sm text-muted-foreground">
                Upload a CSV file or add a transaction manually.
              </p>

              {/* CSV upload */}
              <div className="space-y-2 rounded-md border p-3">
                <p className="text-sm font-medium">Upload CSV</p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: Sparebanken, Curve, Trumf
                </p>
                <div className="flex gap-2">
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="rounded-md border bg-background px-2 py-1.5 text-sm"
                  >
                    <option value="sparebanken">Sparebanken</option>
                    <option value="curve">Curve</option>
                    <option value="trumf">Trumf</option>
                  </select>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
                  />
                </div>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>

              {/* Or manual */}
              <div className="space-y-2 rounded-md border p-3">
                <p className="text-sm font-medium">Or add manually</p>
                <p className="text-xs text-muted-foreground">
                  Negative amount = expense, positive = income
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="rounded-md border bg-background px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="-50.00"
                    className="rounded-md border bg-background px-2 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={manualDesc}
                    onChange={(e) => setManualDesc(e.target.value)}
                    placeholder="Description"
                    className="rounded-md border bg-background px-2 py-1.5 text-sm"
                  />
                </div>
                <button
                  onClick={handleManualTransaction}
                  disabled={!manualAmount || !manualDesc || manualSaving}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {manualSaving ? "Adding..." : "Add transaction"}
                </button>
              </div>

              {uploadResult && (
                <p className="text-sm text-green-600">{uploadResult}</p>
              )}
            </div>
          )}

          {step === "categories" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Review categories</h2>
              <p className="text-sm text-muted-foreground">
                Default categories have been created. Add or remove as needed.
              </p>
              <ul className="max-h-48 overflow-y-auto space-y-1">
                {categories.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted/30"
                  >
                    <span className="text-sm">{c.name}</span>
                    <button
                      onClick={async () => {
                        await deleteCategory(c.id);
                        mutateCats();
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  placeholder="New category"
                  className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
                />
                <button
                  onClick={handleAddCategory}
                  disabled={!newCat.trim()}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {step === "budget" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Set a budget</h2>
              <p className="text-sm text-muted-foreground">
                Set a monthly spending limit for at least one category.
                Budgets help you track spending on the dashboard.
              </p>
              <div className="flex gap-2">
                <select
                  value={budgetCat}
                  onChange={(e) => setBudgetCat(e.target.value)}
                  className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-32 rounded-md border bg-background px-2 py-1.5 text-sm"
                />
                <button
                  onClick={handleSetBudget}
                  disabled={!budgetCat || !budgetAmount}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Set
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">You&apos;re all set!</h2>
              <p className="text-muted-foreground">
                Your finances are ready to go. Head to the dashboard to see your overview.
              </p>
              <button
                onClick={goToDashboard}
                className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToDashboard}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Skip setup
          </button>
          {step !== "welcome" && step !== "done" && (
            <button
              onClick={next}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Skip this step
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
