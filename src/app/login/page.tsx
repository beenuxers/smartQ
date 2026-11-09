"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(form.get("email")),
      password: String(form.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="display mb-10 text-2xl font-semibold tracking-tight">
        SmartQ
      </Link>
      <div className="panel">
        <h1 className="display text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted">Host access for your outlet waitlist.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="field">
            <span>Password</span>
            <input name="password" type="password" required minLength={6} autoComplete="current-password" />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-5 text-sm text-muted">
          New here?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Create a free outlet
          </Link>
        </p>
      </div>
    </main>
  );
}
