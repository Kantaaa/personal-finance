"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";

export default function SettingsPage() {
  const {
    categories,
    isLoading: catLoading,
    addCategory,
    deleteCategory,
  } = useCategories();
  const {
    accounts,
    isLoading: accLoading,
    createAccount,
    deleteAccount,
  } = useAccounts();
  const [newCat, setNewCat] = useState("");
  const [catError, setCatError] = useState<string | null>(null);

  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState("bank");
  const [newAccProvider, setNewAccProvider] = useState("sparebanken");
  const [accError, setAccError] = useState<string | null>(null);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCat.trim()) return;
    setCatError(null);
    try {
      await addCategory(newCat.trim());
      setNewCat("");
    } catch (err: unknown) {
      setCatError(err instanceof Error ? err.message : "Failed to add");
    }
  }

  async function handleDeleteCategory(id: string) {
    setCatError(null);
    try {
      await deleteCategory(id);
    } catch (err: unknown) {
      setCatError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!newAccName.trim()) return;
    setAccError(null);
    try {
      await createAccount(newAccName.trim(), newAccType, newAccProvider);
      setNewAccName("");
    } catch (err: unknown) {
      setAccError(err instanceof Error ? err.message : "Failed to add");
    }
  }

  async function handleDeleteAccount(id: string) {
    setAccError(null);
    try {
      await deleteAccount(id);
    } catch (err: unknown) {
      setAccError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-8">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* Categories */}
        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">Categories</h2>

          {catLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <ul className="space-y-1">
              {categories.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted/30"
                >
                  <span className="text-sm">{c.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="New category"
              className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
            />
            <button
              type="submit"
              disabled={!newCat.trim()}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Add
            </button>
          </form>
          {catError && (
            <p className="text-xs text-destructive">{catError}</p>
          )}
        </section>

        {/* Accounts */}
        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">Accounts</h2>

          {accLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts yet.</p>
          ) : (
            <ul className="space-y-1">
              {accounts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted/30"
                >
                  <div>
                    <span className="text-sm font-medium">{a.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {a.type} &middot; {a.provider}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteAccount(a.id)}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form
            onSubmit={handleAddAccount}
            className="flex flex-wrap gap-2"
          >
            <input
              type="text"
              value={newAccName}
              onChange={(e) => setNewAccName(e.target.value)}
              placeholder="Account name"
              className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
            />
            <select
              value={newAccType}
              onChange={(e) => setNewAccType(e.target.value)}
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              <option value="bank">Bank</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
            <select
              value={newAccProvider}
              onChange={(e) => setNewAccProvider(e.target.value)}
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              <option value="sparebanken">Sparebanken</option>
              <option value="curve">Curve</option>
              <option value="trumf">Trumf</option>
              <option value="other">Other</option>
            </select>
            <button
              type="submit"
              disabled={!newAccName.trim()}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Add
            </button>
          </form>
          {accError && (
            <p className="text-xs text-destructive">{accError}</p>
          )}
        </section>
      </main>
    </div>
  );
}
