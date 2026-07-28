"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type User } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { AuthCard } from "@/components/ui/auth-card";
import { GoogleButton } from "@/components/ui/google-button";

export default function SignupPage() {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ user: User; accessToken: string }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ ...form, phone: form.phone || undefined }),
      });
      setSession(r.user, r.accessToken);
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Join the family" sub="Fresh batches, member offers and faster checkout">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label-field" htmlFor="name">Full name</label><input id="name" required minLength={2} value={form.name} onChange={set("name")} className="input-field" /></div>
        <div><label className="label-field" htmlFor="email">Email</label><input id="email" type="email" required value={form.email} onChange={set("email")} className="input-field" /></div>
        <div><label className="label-field" htmlFor="phone">Phone (optional)</label><input id="phone" value={form.phone} onChange={set("phone")} className="input-field" inputMode="tel" /></div>
        <div><label className="label-field" htmlFor="password">Password</label><input id="password" type="password" required minLength={8} value={form.password} onChange={set("password")} className="input-field" /><p className="mt-1 text-[0.7rem] text-bark/50">At least 8 characters</p></div>
        {error && <p className="text-sm text-copper">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <GoogleButton label="Sign up with Google" />
      <p className="mt-6 text-center text-sm text-bark/70">
        Already with us? <Link href="/login" className="font-semibold text-forest-800 hover:underline">Sign in</Link>
      </p>
    </AuthCard>
  );
}
