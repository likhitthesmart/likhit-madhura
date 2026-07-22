"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { AuthCard } from "@/components/ui/auth-card";

function ResetForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await api("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
          router.push("/login");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Reset failed");
        }
      }}
      className="space-y-4"
    >
      <div><label className="label-field" htmlFor="password">New password</label><input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" /></div>
      {error && <p className="text-sm text-copper">{error}</p>}
      <button className="btn-primary w-full">Set new password</button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Choose a new password">
      <Suspense><ResetForm /></Suspense>
    </AuthCard>
  );
}
