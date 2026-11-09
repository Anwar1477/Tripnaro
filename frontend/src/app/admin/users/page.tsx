"use client";

import { useState } from "react";
import { AdminToolbar, opts, Table } from "@/components/admin/AdminTable";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/Feedback";
import { Pagination } from "@/components/common/Pagination";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { errorMessage, getPaginated, send } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "@/store/toast";
import type { User } from "@/types";

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounce(q, 300);
  const list = useAsync(() => getPaginated<User>("/admin/users", { q: dq || undefined, role: role || undefined, page }), [dq, role, page]);

  async function update(u: User, body: Partial<User>) {
    try {
      const res = await send<User>("patch", `/admin/users/${u._id}`, body);
      toast.success(res.message);
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-semibold">Users</h1>
      <AdminToolbar q={q} onQ={(v) => { setQ(v); setPage(1); }} filters={[{ label: "Role", value: role, onChange: (v) => { setRole(v); setPage(1); }, options: opts("user", "admin") }]} />
      {list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : list.loading && !list.data ? <Skeleton className="h-64" /> : !list.data?.items.length ? <EmptyState title="No users found" /> : (
        <>
          <Table head={["Name", "Email", "Phone", "Role", "Status", "Joined", "Actions"]}>
            {list.data.items.map((u) => {
              const self = u._id === me?._id;
              return (
                <tr key={u._id}>
                  <td className="px-4 py-2.5 font-semibold">{u.name}</td>
                  <td className="px-4 py-2.5">{u.email}</td>
                  <td className="px-4 py-2.5">{u.phone ?? "—"}</td>
                  <td className="px-4 py-2.5"><Badge tone={u.role === "admin" ? "coral" : "neutral"}>{u.role}</Badge></td>
                  <td className="px-4 py-2.5"><Badge tone={u.isActive ? "success" : "danger"}>{u.isActive ? "Active" : "Disabled"}</Badge></td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" disabled={self} onClick={() => update(u, { role: u.role === "admin" ? "user" : "admin" })}>{u.role === "admin" ? "Make user" : "Make admin"}</Button>
                      <Button size="sm" variant="ghost" disabled={self} onClick={() => update(u, { isActive: !u.isActive })}>{u.isActive ? "Disable" : "Enable"}</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
          <Pagination page={page} totalPages={list.data.meta.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
