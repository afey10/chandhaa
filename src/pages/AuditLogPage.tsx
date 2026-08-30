import React, { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import * as rpc from "../api/rpc";
import { getErrorMessage } from "../api/rpc";
import { useToast } from "../components/Toast";
import { AuditEntry } from "../types";

const PAGE_SIZE = 25;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AuditLogPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [recordType, setRecordType] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLog = useCallback(() => {
    setLoading(true);
    rpc
      .listAuditLog({ page, pageSize: PAGE_SIZE, search, recordType })
      .then((res: any) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err) => showToast(getErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  }, [page, search, recordType]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppLayout>
      <h1 className="font-display text-2xl font-semibold text-navy-950">Audit Log</h1>
      <p className="mt-1 text-sm text-gray-500">A record of every add, edit and delete action taken in the Dhaftharu.</p>

      <div className="card mt-5 flex flex-col gap-3 p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            placeholder="Search by user, service number or record…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
          />
        </div>
        <select value={recordType} onChange={(e) => { setPage(1); setRecordType(e.target.value); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">All record types</option>
          <option value="vehicle">Vehicles</option>
          <option value="vessel">Vessels</option>
          <option value="user">Users</option>
          <option value="category">Categories</option>
        </select>
      </div>

      <div className="card mt-4 divide-y divide-[#f0f1f5]">
        {loading && <div className="px-4 py-10 text-center text-gray-400">Loading audit log…</div>}
        {!loading && items.length === 0 && <div className="px-4 py-10 text-center text-gray-400">No matching audit entries.</div>}
        {!loading &&
          items.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-sm text-navy-950">
                  <span className="font-medium">{entry.userName} ({entry.serviceNumber})</span> {entry.action.toLowerCase()}
                  {entry.recordLabel ? <> <span className="font-mono-reg font-medium">{entry.recordLabel}</span></> : null}.
                </span>
              </div>
              <div className="text-xs text-gray-400">{formatDateTime(entry.createdAt)}</div>
            </div>
          ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40">Prev</button>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      </div>
    </AppLayout>
  );
}
