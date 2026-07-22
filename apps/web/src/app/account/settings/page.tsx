"use client";
import { useEffect, useState } from "react";
import { api, type User } from "@/lib/api";
import { useAuth } from "@/store/auth";

export default function SettingsPage() {
  const { user, accessToken, setSession } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pw, setPw] = useState({ current: "", password: "" });
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? "");
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setMsg(null);
          try {
            await api<{ user: User }>("/account/profile", {
              method: "PATCH",
              token: accessToken,
              body: JSON.stringify({ name, phone: phone || null }),
            });
            if (user && accessToken) setSession({ ...user, name, phone: phone || null }, accessToken);
            setMsg("Profile updated");
          } catch (err) {
            setMsg(err instanceof Error ? err.message : "Update failed");
          }
        }}
        className="card-organic space-y-4 p-7"
      >
        <h2 className="font-display text-2xl text-forest-900">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label-field" htmlFor="name">Name</label><input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} className="input-field" /></div>
          <div><label className="label-field" htmlFor="phone">Phone</label><input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" /></div>
        </div>
        <p className="text-xs text-bark/50">Email: {user?.email} (contact support to change)</p>
        {msg && <p className="text-sm text-forest-700">{msg}</p>}
        <button className="btn-primary">Save changes</button>
      </form>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setPwMsg(null);
          try {
            await api("/account/change-password", { method: "POST", token: accessToken, body: JSON.stringify(pw) });
            setPw({ current: "", password: "" });
            setPwMsg("Password changed");
          } catch (err) {
            setPwMsg(err instanceof Error ? err.message : "Change failed");
          }
        }}
        className="card-organic space-y-4 p-7"
      >
        <h2 className="font-display text-2xl text-forest-900">Change password</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label-field" htmlFor="current">Current password</label><input id="current" type="password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className="input-field" /></div>
          <div><label className="label-field" htmlFor="new">New password</label><input id="new" type="password" required minLength={8} value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} className="input-field" /></div>
        </div>
        {pwMsg && <p className="text-sm text-forest-700">{pwMsg}</p>}
        <button className="btn-primary">Update password</button>
      </form>
    </div>
  );
}
