"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import {
  EmptyState,
  Input,
  Note,
  PageLoader,
  Pagination,
  Panel,
  Select,
  StatusBadge,
  Table,
  Td,
  btnGhost,
  rowCls,
  useAdminFetch,
} from "@/components/admin/ui";
import { CustomerDetail } from "@/components/admin/customer-detail";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  blocked: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  _count: { orders: number };
}

export default function UsersPage() {
  const { user: me, accessToken: token } = useAuth();
  const isAdmin = me?.role === "ADMIN";
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const [openUser, setOpenUser] = useState<string | null>(null);

  const { data, error, loading, reload } = useAdminFetch<{ users: AdminUser[]; total: number; pages: number }>(
    `/admin/users?q=${encodeURIComponent(search)}&page=${page}`
  );

  const patch = async (id: string, body: { role?: string; blocked?: boolean }) => {
    setMsg(null);
    try {
      await api(`/admin/users/${id}`, { method: "PATCH", token, body: JSON.stringify(body) });
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Update failed");
    }
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q);
        }}
        className="flex gap-2"
      >
        <Input placeholder="Search by name, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <button className={btnGhost}>Search</button>
      </form>

      {msg && <Note>{msg}</Note>}
      {error && <Note>{error}</Note>}

      <Panel>
        {loading ? (
          <PageLoader />
        ) : data?.users.length ? (
          <>
            <Table head={["Customer", "Contact", "Orders", "Role", "Status", "Last login", "Joined"]}>
              {data.users.map((u) => (
                <tr key={u.id} className={rowCls}>
                  <Td className="font-medium text-ivory">
                    <button
                      type="button"
                      onClick={() => setOpenUser(u.id)}
                      className="text-left underline-offset-4 transition-colors hover:text-gold hover:underline"
                    >
                      {u.name}
                    </button>
                  </Td>
                  <Td>
                    <p className="text-ivory/70">{u.email}</p>
                    {u.phone && <p className="text-xs text-ivory/40">{u.phone}</p>}
                  </Td>
                  <Td className="tabular-nums">{u._count.orders}</Td>
                  <Td>
                    {isAdmin ? (
                      <Select
                        value={u.role}
                        onChange={(e) => void patch(u.id, { role: e.target.value })}
                        className="w-32 py-1 text-xs"
                        disabled={u.id === me?.id}
                      >
                        {["CUSTOMER", "STAFF", "ADMIN"].map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <StatusBadge status={u.role} />
                    )}
                  </Td>
                  <Td>
                    {isAdmin && u.id !== me?.id ? (
                      <button
                        className={btnGhost}
                        onClick={() => void patch(u.id, { blocked: !u.blocked })}
                      >
                        {u.blocked ? "Unblock" : "Block"}
                      </button>
                    ) : (
                      <StatusBadge status={u.blocked ? "BLOCKED" : "ACTIVE"} />
                    )}
                    {isAdmin && u.blocked && <StatusBadge status="BLOCKED" />}
                  </Td>
                  <Td className="text-ivory/50">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-IN") : "—"}</Td>
                  <Td className="text-ivory/50">{new Date(u.createdAt).toLocaleDateString("en-IN")}</Td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} pages={data.pages} onPage={setPage} />
          </>
        ) : (
          <EmptyState label="No users found" />
        )}
      </Panel>

      {openUser && <CustomerDetail userId={openUser} onClose={() => setOpenUser(null)} />}
    </div>
  );
}
