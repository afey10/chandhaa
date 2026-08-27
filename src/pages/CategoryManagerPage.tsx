import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import * as rpc from "../api/rpc";
import { getErrorMessage } from "../api/rpc";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { Category } from "../types";

export default function CategoryManagerPage({
  title,
  description,
  kind,
}: {
  title: string;
  description: string;
  kind: "vehicle" | "vessel";
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const isAdmin = user?.role === "admin";

  const list = kind === "vehicle" ? rpc.listVehicleCategories : rpc.listVesselCategories;
  const create = kind === "vehicle" ? rpc.createVehicleCategory : rpc.createVesselCategory;
  const remove = kind === "vehicle" ? rpc.deleteVehicleCategory : rpc.deleteVesselCategory;

  const load = () => {
    setLoading(true);
    list()
      .then((items: any) => setCategories(items))
      .catch((err) => showToast(getErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [kind]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await create(newName.trim());
      showToast(`Category "${newName.trim()}" added.`);
      setNewName("");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      showToast(`Category "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      setDeleteTarget(null);
    }
  };

  return (
    <AppLayout>
      <h1 className="font-display text-2xl font-semibold text-navy-950">{title}</h1>
      <p className="mt-1 text-sm text-gray-500">{description}</p>

      {isAdmin && (
        <form onSubmit={handleAdd} className="card mt-5 flex flex-col gap-3 p-4 sm:flex-row">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name…"
            className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
          />
          <button type="submit" className="flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
            <Plus size={15} /> Add Category
          </button>
        </form>
      )}

      <div className="card mt-5 divide-y divide-[#f0f1f5]">
        {loading && <div className="px-4 py-8 text-center text-gray-400">Loading categories…</div>}
        {!loading && categories.length === 0 && <div className="px-4 py-8 text-center text-gray-400">No categories yet.</div>}
        {!loading &&
          categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-navy-950">{c.name}</span>
              {isAdmin && (
                <button onClick={() => setDeleteTarget(c)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this category?"
        message={`"${deleteTarget?.name}" will be removed. Categories currently in use by existing records cannot be deleted.`}
        confirmLabel="Delete Category"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
