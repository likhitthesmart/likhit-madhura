"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import {
  EmptyState,
  SearchInput,
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
  DateRange,
  rangeQuery,
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
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, error, loading, reload } = useAdminFetch<{ users: AdminUser[]; total: number; pages: number }>(
    `/admin/users?q=${encodeURIComponent(search)}&page=${page}${rangeQuery(from, to)}`
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
      <DateRange
        from={from}
        to={to}
        onChange={(f, t) => {
          setFrom(f);
          setTo(t);
          setPage(1); // a new range can have fewer pages than the one being viewed
        }}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q);
        }}
        className="flex gap-2"
      >
        <SearchInput
          placeholder="Search by name, email, phone…"
          value={q}
          onChange={setQ}
          onPick={(v) => {
            setPage(1);
            setSearch(v);
          }}
          suggest={async (term) => {
            const r = await api<{ users: AdminUser[] }>(`/admin/users?q=${encodeURIComponent(term)}&page=1`, { token });
            // committing the email, not the label — it is what the q filter matches on
            return r.users.map((u) => ({ label: `${u.name} · ${u.email}`, value: u.email }));
          }}
          className="max-w-sm"
        />
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
                  <Td className="font-medium text-ink">
                    <button
                      type="button"
                      onClick={() => setOpenUser(u.id)}
                      className="text-left underline-offset-4 transition-colors hover:text-gold hover:underline"
                    >
                      {u.name}
                    </button>
                  </Td>
                  <Td>
                    <p className="text-ink/75">{u.email}</p>
                    {u.phone && <p className="text-xs text-bark/70">{u.phone}</p>}
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
                  <Td className="text-bark/80">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-IN") : "—"}</Td>
                  <Td className="text-bark/80">{new Date(u.createdAt).toLocaleDateString("en-IN")}</Td>
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
