"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type User } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { AuthCard } from "@/components/ui/auth-card";
import { GoogleButton } from "@/components/ui/google-button";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // The Google callback redirects here with ?error=. Read it after mount, never in
  // the initial state — the server renders without a URL query, so branching on
  // `window` there makes the first client render disagree and breaks hydration.
  useEffect(() => {
    const fromCallback = new URLSearchParams(window.location.search).get("error");
    if (!fromCallback) return;
    setError(fromCallback);
    // drop it from the URL, or a reload or back-button shows the stale message again
    // long after the cause is fixed
    history.replaceState(null, "", window.location.pathname);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ user: User; accessToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, remember }),
      });
      setSession(r.user, r.accessToken);
      router.push(r.user.role === "ADMIN" || r.user.role === "STAFF" ? "/admin" : "/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Welcome back" sub="Sign in to your Madhura Naturals account">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label-field" htmlFor="email">Email</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" /></div>
        <div><label className="label-field" htmlFor="password">Password</label><input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" /></div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-bark"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-forest-700" /> Remember me</label>
          <Link href="/forgot-password" className="font-medium text-forest-800 hover:underline">Forgot password?</Link>
        </div>
        {error && <p className="text-sm text-copper">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <GoogleButton label="Sign in with Google" />
      <p className="mt-6 text-center text-sm text-bark/70">
        New to Madhura? <Link href="/signup" className="font-semibold text-forest-800 hover:underline">Create an account</Link>
      </p>
    </AuthCard>
  );
}
