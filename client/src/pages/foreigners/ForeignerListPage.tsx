import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, SlidersHorizontal } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import * as rpc from "../../api/rpc";
import { getErrorMessage, publicFileUrl, deleteFile } from "../../api/rpc";
import { daysRemaining, formatDate } from "../../utils/date";
import { useToast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { Foreigner } from "../../types";

const PAGE_SIZE = 10;

export default function ForeignerListPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [filterOptions, setFilterOptions] = useState<{ countries: string[]; occupations: string[]; workPlaces: string[] }>({
    countries: [],
    occupations: [],
    workPlaces: [],
  });
  const [country, setCountry] = useState("");
  const [occupation, setOccupation] = useState("");
  const [workPlace, setWorkPlace] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [items, setItems] = useState<Foreigner[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAll, setTotalAll] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Foreigner | null>(null);

  useEffect(() => {
    rpc.getForeignerFilterOptions().then(setFilterOptions).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [country, occupation, workPlace, debouncedSearch]);

  const fetchList = useCallback(() => {
    setLoading(true);
    rpc
      .listForeigners({ search: debouncedSearch, country, occupation, workPlace, page, pageSize: PAGE_SIZE })
      .then((res: any) => {
        setItems(res.items);
        setTotal(res.total);
        setTotalAll(res.totalAll);
      })
      .catch((err) => showToast(getErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, country, occupation, workPlace, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await rpc.deleteForeigner(deleteTarget.id);
      if (res.photoUrl) await deleteFile(res.photoUrl);
      showToast(`${deleteTarget.fullName} has been deleted.`);
      setDeleteTarget(null);
      fetchList();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const clearFilters = () => {
    setCountry("");
    setOccupation("");
    setWorkPlace("");
    setSearch("");
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canEdit = user?.role === "admin" || user?.canEditRecords;
  const canDelete = user?.role === "admin";
  const hasFilters = !!(country || occupation || workPlace || search);

  return (
    <AppLayout>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-950">Foreigner List</h1>
          <p className="mt-1 text-sm text-gray-500">
            Showing {items.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, total)} of {total} foreigners
            {total !== totalAll ? ` (filtered from ${totalAll})` : ""}
          </p>
        </div>
        <Link to="/bidheyseenge/foreigners/add" className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
          + Add Foreigner
        </Link>
      </div>

      <div className="card mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, passport no., visa no., contact, sponsor, or workplace…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <SlidersHorizontal size={15} /> Filters
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="text-sm font-medium text-navy-700 hover:underline">
            Clear Filters
          </button>
        )}
      </div>

      {showFilters && (
        <div className="card mb-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Country</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">All countries</option>
              {filterOptions.countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Occupation</label>
            <select value={occupation} onChange={(e) => setOccupation(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">All occupations</option>
              {filterOptions.occupations.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Work Place</label>
            <select value={workPlace} onChange={(e) => setWorkPlace(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">All work places</option>
              {filterOptions.workPlaces.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="card hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="border-b border-[#e5e8f0] text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Full Name</th>
              <th className="px-4 py-3">Passport No.</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Visa No.</th>
              <th className="px-4 py-3">Occupation</th>
              <th className="px-4 py-3">Work Place</th>
              <th className="px-4 py-3">Passport</th>
              <th className="px-4 py-3">Visa</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">Loading foreigners…</td></tr>}
            {!loading && items.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">No foreigners match your search or filters.</td></tr>
            )}
            {!loading &&
              items.map((f) => (
                <tr key={f.id} className="border-b border-[#f0f1f5] hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {f.photoUrl ? (
                      <img src={publicFileUrl(f.photoUrl) || ""} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-700">{f.fullName.slice(0, 1)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/bidheyseenge/foreigners/${f.id}`)} className="font-medium text-navy-900 hover:underline">
                      {f.fullName}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono-reg text-gray-700">{f.passportNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{f.country}</td>
                  <td className="px-4 py-3 font-mono-reg text-gray-700">{f.workVisaNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{f.occupation || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{f.workPlace || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={f.status.passport} daysRemaining={daysRemaining(f.passportExpiryDate)} /></td>
                  <td className="px-4 py-3"><StatusBadge status={f.status.visa} daysRemaining={daysRemaining(f.workVisaExpiryDate)} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to={`/bidheyseenge/foreigners/${f.id}`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" title="View"><Eye size={16} /></Link>
                      {canEdit && <Link to={`/bidheyseenge/foreigners/${f.id}/edit`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" title="Edit"><Pencil size={16} /></Link>}
                      {canDelete && (
                        <button onClick={() => setDeleteTarget(f)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {loading && <div className="card px-4 py-10 text-center text-gray-400">Loading foreigners…</div>}
        {!loading && items.length === 0 && <div className="card px-4 py-10 text-center text-gray-400">No foreigners match your search or filters.</div>}
        {!loading &&
          items.map((f) => (
            <div key={f.id} className="card p-4">
              <div className="flex items-start gap-3">
                {f.photoUrl ? (
                  <img src={publicFileUrl(f.photoUrl) || ""} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-700">{f.fullName.slice(0, 1)}</div>
                )}
                <div className="min-w-0 flex-1">
                  <button onClick={() => navigate(`/bidheyseenge/foreigners/${f.id}`)} className="truncate text-base font-semibold text-navy-900">{f.fullName}</button>
                  <div className="truncate text-xs text-gray-500">{f.passportNumber} · {f.country}</div>
                  {(f.occupation || f.workPlace) && <div className="truncate text-xs text-gray-500">{f.occupation}{f.occupation && f.workPlace ? " · " : ""}{f.workPlace}</div>}
                </div>
                <div className="flex gap-1">
                  <Link to={`/bidheyseenge/foreigners/${f.id}`} className="rounded-lg p-1.5 text-gray-500"><Eye size={16} /></Link>
                  {canEdit && <Link to={`/bidheyseenge/foreigners/${f.id}/edit`} className="rounded-lg p-1.5 text-gray-500"><Pencil size={16} /></Link>}
                  {canDelete && <button onClick={() => setDeleteTarget(f)} className="rounded-lg p-1.5 text-gray-500"><Trash2 size={16} /></button>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <StatusBadge status={f.status.passport} />
                <StatusBadge status={f.status.visa} />
              </div>
            </div>
          ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40">
            <ChevronLeft size={15} /> Prev
          </button>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40">
            Next <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this foreigner record?"
        message={`This will permanently remove ${deleteTarget?.fullName}'s record from the Dhaftharu. This action cannot be undone.`}
        confirmLabel="Delete Record"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
