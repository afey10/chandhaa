import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, SlidersHorizontal } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import api, { getErrorMessage } from "../../api/client";
import { daysRemaining } from "../../utils/date";
import { useToast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { Category, Vessel } from "../../types";

const PAGE_SIZE = 10;

export default function VesselListPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [overallStatus, setOverallStatus] = useState("");
  const [sortBy, setSortBy] = useState("registration_number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [items, setItems] = useState<Vessel[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAll, setTotalAll] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Vessel | null>(null);

  useEffect(() => {
    api.get("/categories/vessel-categories").then((res) => setCategories(res.data.items));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [category, debouncedSearch, overallStatus, sortBy, sortDir]);

  const fetchList = useCallback(() => {
    setLoading(true);
    api
      .get("/vessels", {
        params: { search: debouncedSearch, category, overallStatus, sortBy, sortDir, page, pageSize: PAGE_SIZE },
      })
      .then((res) => {
        setItems(res.data.items);
        setTotal(res.data.total);
        setTotalAll(res.data.totalAll);
      })
      .catch((err) => showToast(getErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, category, overallStatus, sortBy, sortDir, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/vessels/${deleteTarget.id}`);
      showToast(`Vessel ${deleteTarget.registrationNumber} has been deleted.`);
      setDeleteTarget(null);
      fetchList();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  const clearFilters = () => {
    setCategory("");
    setSearch("");
    setOverallStatus("");
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canEdit = user?.role === "admin" || user?.canEditRecords;
  const canDelete = user?.role === "admin";

  return (
    <AppLayout>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-950">Vessel List</h1>
          <p className="mt-1 text-sm text-gray-500">
            Showing {items.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, total)} of {total} vessels
            {total !== totalAll ? ` (filtered from ${totalAll})` : ""}
          </p>
        </div>
        <Link to="/vessels/new" className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
          + Add Vessel
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory("")}
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
            category === "" ? "border-navy-900 bg-navy-900 text-white" : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          All Categories
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              category === c.id ? "border-navy-900 bg-navy-900 text-white" : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="card mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by registration number, owner name, or ID card number…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <SlidersHorizontal size={15} /> Filters
        </button>
        {(category || search || overallStatus) && (
          <button onClick={clearFilters} className="text-sm font-medium text-navy-700 hover:underline">
            Clear all filters
          </button>
        )}
      </div>

      {showFilters && (
        <div className="card mb-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Overall Status</label>
            <select value={overallStatus} onChange={(e) => setOverallStatus(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Any status</option>
              <option value="valid">Valid</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-[#e5e8f0] text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort("registration_number")}>
                Registration No.
              </th>
              <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort("owner_name")}>
                Owner
              </th>
              <th className="px-4 py-3">ID Card</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort("category")}>
                Category
              </th>
              <th className="px-4 py-3">Annual Fee</th>
              <th className="px-4 py-3">Insurance</th>
              <th className="px-4 py-3">Roadworthiness</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  Loading vessels…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  No vessels match your search or filters.
                </td>
              </tr>
            )}
            {!loading &&
              items.map((v) => (
                <tr key={v.id} className="border-b border-[#f0f1f5] hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/vessels/${v.id}`)} className="font-mono-reg font-medium text-navy-900 hover:underline">
                      {v.registrationNumber}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{v.ownerFullName}</td>
                  <td className="px-4 py-3 text-gray-500">{v.ownerIdCard}</td>
                  <td className="px-4 py-3 text-gray-700">{v.categoryName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.status.annualFee} daysRemaining={daysRemaining(v.annualFeeExpiry)} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.status.insurance} daysRemaining={daysRemaining(v.insuranceExpiry)} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.status.roadworthiness} daysRemaining={daysRemaining(v.roadworthinessExpiry)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to={`/vessels/${v.id}`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" title="View">
                        <Eye size={16} />
                      </Link>
                      {canEdit && (
                        <Link to={`/vessels/${v.id}/edit`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" title="Edit">
                          <Pencil size={16} />
                        </Link>
                      )}
                      {canDelete && (
                        <button onClick={() => setDeleteTarget(v)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600" title="Delete">
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

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </div>
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
        title="Delete this vessel?"
        message={`This will permanently remove vessel ${deleteTarget?.registrationNumber} from the Dhaftharu. This action cannot be undone.`}
        confirmLabel="Delete Vessel"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
