"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { FormEvent, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { TurnstileField } from "@/components/turnstile-field";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const onToken = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (siteKey && !turnstileToken) {
      setLoading(false);
      setError("Complete the bot check and try again");
      return;
    }

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
      outletName: String(form.get("outletName")),
      country: String(form.get("country")),
      currency: String(form.get("currency") || "USD"),
      turnstileToken: turnstileToken || undefined,
    };

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setTurnstileToken("");
      setError(data.error || "Registration failed");
      return;
    }

    const login = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });
    setLoading(false);
    if (login?.error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <Link href="/" className="display mb-10 text-2xl font-semibold tracking-tight">
        SmartQ
      </Link>
      <div className="panel">
        <h1 className="display text-2xl font-semibold">Open your waitlist</h1>
        <p className="mt-2 text-sm text-muted">
          Singapore, Indonesia, or Malaysia — live with a QR in minutes.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="field">
            <span>Your name</span>
            <input name="name" required autoComplete="name" />
          </label>
          <label className="field">
            <span>Outlet / cafe name</span>
            <input name="outletName" required placeholder="Kopi Corner" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span>Country</span>
              <select name="country" defaultValue="SG">
                <option value="SG">Singapore</option>
                <option value="ID">Indonesia</option>
                <option value="MY">Malaysia</option>
              </select>
            </label>
            <label className="field">
              <span>Billing currency</span>
              <select name="currency" defaultValue="USD">
                <option value="USD">USD (default)</option>
                <option value="auto">Auto from country</option>
                <option value="SGD">SGD</option>
                <option value="IDR">IDR</option>
                <option value="MYR">MYR</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          {siteKey ? <TurnstileField siteKey={siteKey} onToken={onToken} /> : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Creating…" : "Create free outlet"}
          </button>
        </form>
        <p className="mt-5 text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
