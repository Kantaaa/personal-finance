"use client";

import { Suspense, useCallback, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [challengeCode, setChallengeCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const callbackError = searchParams.get("error");

  const startGuestMode = useCallback(() => {
    setChallengeCode(generateCode());
    setCodeInput("");
    setError(null);
    setGuestMode(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  async function handleGuestSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (codeInput !== challengeCode) {
      setError("Code does not match. Try again.");
      setChallengeCode(generateCode());
      setCodeInput("");
      return;
    }

    setGuestLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      setError(error.message);
      setGuestLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  if (guestMode) {
    return (
      <>
        <p className="mb-4 text-sm text-muted-foreground">
          Type the code below to continue as guest:
        </p>

        <div className="mb-4 flex justify-center">
          <span className="rounded-md bg-muted px-6 py-3 font-mono text-3xl font-bold tracking-[0.3em]">
            {challengeCode}
          </span>
        </div>

        <form onSubmit={handleGuestSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            required
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 4-digit code"
            className="w-full rounded-md border bg-background px-3 py-2 text-center font-mono text-lg tracking-widest"
            autoFocus
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={guestLoading || codeInput.length !== 4}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {guestLoading ? "Signing in..." : "Continue as guest"}
          </button>
        </form>

        <button
          onClick={() => setGuestMode(false)}
          className="mt-4 text-sm text-muted-foreground hover:underline"
        >
          Back to sign in
        </button>
      </>
    );
  }

  return (
    <>
      {callbackError && (
        <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {callbackError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={startGuestMode}
        className="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
      >
        Continue as guest
      </button>

      <div className="mt-4 flex justify-between text-sm">
        <Link href="/register" className="text-muted-foreground hover:underline">
          Create account
        </Link>
        <Link href="/reset-password" className="text-muted-foreground hover:underline">
          Forgot password?
        </Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-6 text-2xl font-bold">Sign in</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
