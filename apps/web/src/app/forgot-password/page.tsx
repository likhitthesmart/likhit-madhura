"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AuthCard } from "@/components/auth-card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <AuthCard title="Reset your password" sub="We'll email you a secure reset link">
      {done ? (
        <p className="text-center text-sm text-forest-700">If an account exists for {email}, a reset link is on its way. Check your inbox.</p>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await api("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }).catch(() => undefined);
            setDone(true);
          }}
          className="space-y-4"
        >
          <div><label className="label-field" htmlFor="email">Email</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" /></div>
          <button className="btn-primary w-full">Send reset link</button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-bark/70"><Link href="/login" className="font-semibold text-forest-800 hover:underline">Back to sign in</Link></p>
    </AuthCard>
  );
}
