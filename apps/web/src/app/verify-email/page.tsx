"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { AuthCard } from "@/components/ui/auth-card";

function Verify() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<"busy" | "ok" | "bad">("busy");
  useEffect(() => {
    if (!token) return setState("bad");
    api("/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) })
      .then(() => setState("ok"))
      .catch(() => setState("bad"));
  }, [token]);
  return (
    <div className="text-center text-sm">
      {state === "busy" && <p className="text-bark/60">Verifying…</p>}
      {state === "ok" && (
        <>
          <p className="text-forest-700">Your email is verified. Welcome to the family! 🌿</p>
          <Link href="/account" className="btn-primary mt-6">Go to my account</Link>
        </>
      )}
      {state === "bad" && <p className="text-copper">This verification link is invalid or already used.</p>}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthCard title="Email verification">
      <Suspense><Verify /></Suspense>
    </AuthCard>
  );
}
