import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, User } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import * as rpc from "../../api/rpc";
import { getErrorMessage, publicFileUrl, deleteFile } from "../../api/rpc";
import { daysRemaining, formatDate } from "../../utils/date";
import { useToast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { Foreigner } from "../../types";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#f0f1f5] py-2.5 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-medium text-navy-950">{value ?? "—"}</span>
    </div>
  );
}

export default function ForeignerDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [foreigner, setForeigner] = useState<Foreigner | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = () => {
    setLoading(true);
    rpc
      .getForeigner(id!)
      .then((res) => setForeigner(res.foreigner))
      .catch((err) => showToast(getErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleDelete = async () => {
    try {
      const res = await rpc.deleteForeigner(id!);
      if (res.photoUrl) await deleteFile(res.photoUrl);
      showToast(`${foreigner?.fullName} has been deleted.`);
      navigate("/bidheyseenge/foreigners");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  if (loading || !foreigner) {
    return <AppLayout><div className="py-20 text-center text-gray-400">Loading foreigner details…</div></AppLayout>;
  }

  const canEdit = user?.role === "admin" || user?.canEditRecords;
  const canDelete = user?.role === "admin";

  return (
    <AppLayout>
      <button onClick={() => navigate("/bidheyseenge/foreigners")} className="mb-4 flex items-center gap-1 text-sm font-medium text-navy-700 hover:underline">
        <ArrowLeft size={15} /> Back to Foreigner List
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          {foreigner.photoUrl ? (
            <img src={publicFileUrl(foreigner.photoUrl) || ""} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-100 text-navy-700"><User size={26} /></div>
          )}
          <div>
            <div className="text-2xl font-semibold text-navy-950">{foreigner.fullName}</div>
            <div className="mt-1 text-sm text-gray-500">{foreigner.country} · {foreigner.occupation || "—"}</div>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Link to={`/bidheyseenge/foreigners/${id}/edit`} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Pencil size={15} /> Edit Foreigner
            </Link>
          )}
          {canDelete && (
            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
              <Trash2 size={15} /> Delete Foreigner
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="card p-5">
            <h2 className="mb-3 font-display text-base font-semibold text-navy-950">Passport & Visa Information</h2>
            <InfoRow label="Passport Number" value={<span className="font-mono-reg">{foreigner.passportNumber}</span>} />
            <InfoRow label="Passport Expiry" value={formatDate(foreigner.passportExpiryDate)} />
            <InfoRow label="Work Visa Number" value={<span className="font-mono-reg">{foreigner.workVisaNumber}</span>} />
            <InfoRow label="Work Visa Expiry" value={formatDate(foreigner.workVisaExpiryDate)} />
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-display text-base font-semibold text-navy-950">Contact & Address</h2>
            <InfoRow label="Contact Number" value={foreigner.contactNumber} />
            <InfoRow label="Present Address" value={foreigner.presentAddress} />
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-display text-base font-semibold text-navy-950">Employment Information</h2>
            <InfoRow label="Work Place" value={foreigner.workPlace} />
            <InfoRow label="Sponsor" value={foreigner.sponsor} />
            <InfoRow label="Occupation" value={foreigner.occupation} />
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-display text-base font-semibold text-navy-950">Duration</h2>
            <InfoRow label="Duration in the Island" value={foreigner.durationInIsland} />
            <InfoRow label="Duration in Maldives" value={foreigner.durationInMaldives} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="mb-3 font-display text-base font-semibold text-navy-950">Document Status</h2>
            <div className="space-y-4">
              <div>
                <div className="mb-1 text-xs font-mono-reg uppercase tracking-wide text-gray-400">Passport</div>
                <div className="text-sm font-medium text-navy-950">{formatDate(foreigner.passportExpiryDate)}</div>
                <div className="mt-1.5"><StatusBadge status={foreigner.status.passport} daysRemaining={daysRemaining(foreigner.passportExpiryDate)} /></div>
              </div>
              <div>
                <div className="mb-1 text-xs font-mono-reg uppercase tracking-wide text-gray-400">Work Visa</div>
                <div className="text-sm font-medium text-navy-950">{formatDate(foreigner.workVisaExpiryDate)}</div>
                <div className="mt-1.5"><StatusBadge status={foreigner.status.visa} daysRemaining={daysRemaining(foreigner.workVisaExpiryDate)} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this foreigner record?"
        message={`This will permanently remove ${foreigner.fullName}'s record from the Dhaftharu. This action cannot be undone.`}
        confirmLabel="Delete Record"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </AppLayout>
  );
}
