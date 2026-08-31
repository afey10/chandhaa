import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, FileText } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import ReminderButton from "../../components/ReminderButton";
import * as rpc from "../../api/rpc";
import { getErrorMessage, publicFileUrl } from "../../api/rpc";
import { daysRemaining, formatDate } from "../../utils/date";
import { useToast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { Vessel } from "../../types";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#f0f1f5] py-2.5 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-medium text-navy-950">{value ?? "—"}</span>
    </div>
  );
}

export default function VesselDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [vessel, setVessel] = useState<Vessel | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = () => {
    setLoading(true);
    rpc
      .getVessel(id!)
      .then((res) => {
        setVessel(res.vessel);
        setDocuments(res.documents);
      })
      .catch((err) => showToast(getErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleDelete = async () => {
    try {
      await rpc.deleteVessel(id!);
      showToast(`Vessel ${vessel?.registrationNumber} has been deleted.`);
      navigate("/vessels/list");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  if (loading || !vessel) {
    return <AppLayout><div className="py-20 text-center text-gray-400">Loading vessel details…</div></AppLayout>;
  }

  const canEdit = user?.role === "admin" || user?.canEditRecords;
  const canDelete = user?.role === "admin";

  return (
    <AppLayout>
      <button onClick={() => navigate("/vessels/list")} className="mb-4 flex items-center gap-1 text-sm font-medium text-navy-700 hover:underline">
        <ArrowLeft size={15} /> Back to Vessel List
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono-reg text-2xl font-semibold text-navy-950">{vessel.registrationNumber}</div>
          <div className="mt-1 text-sm text-gray-500">{vessel.categoryName} {vessel.vesselName ? `· ${vessel.vesselName}` : ""}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ReminderButton type="vessel" registrationNumber={vessel.registrationNumber} contactNumber={vessel.contactNumber} status={vessel.status} />
          {canEdit && (
            <Link to={`/vessels/${id}/edit`} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Pencil size={15} /> Edit Vessel
            </Link>
          )}
          {canDelete && (
            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
              <Trash2 size={15} /> Delete Vessel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="card p-5">
            <h2 className="mb-3 font-display text-base font-semibold text-navy-950">Vessel Information</h2>
            <InfoRow label="Registration Number" value={<span className="font-mono-reg">{vessel.registrationNumber}</span>} />
            <InfoRow label="Category" value={vessel.categoryName} />
            <InfoRow label="Vessel Name" value={vessel.vesselName} />
            <InfoRow label="Make / Builder" value={vessel.builder} />
            <InfoRow label="Model / Type" value={vessel.model} />
            <InfoRow label="Year" value={vessel.year} />
            <InfoRow label="Colour" value={vessel.colour} />
            <InfoRow label="Engine Number" value={vessel.engineNumber} />
            <InfoRow label="Hull Number" value={vessel.hullNumber} />
            <InfoRow label="Length" value={vessel.length ? `${vessel.length} m` : null} />
            <InfoRow label="Width" value={vessel.width ? `${vessel.width} m` : null} />
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-display text-base font-semibold text-navy-950">Owner Information</h2>
            <InfoRow label="Full Name" value={vessel.ownerFullName} />
            <InfoRow label="ID Card Number" value={vessel.ownerIdCard} />
            <InfoRow label="Address" value={vessel.ownerAddress} />
            <InfoRow label="Contact Number" value={vessel.contactNumber} />
          </div>

          {vessel.remarks && (
            <div className="card p-5">
              <h2 className="mb-2 font-display text-base font-semibold text-navy-950">Remarks</h2>
              <p className="text-sm text-gray-600">{vessel.remarks}</p>
            </div>
          )}

          {documents.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 font-display text-base font-semibold text-navy-950">Supporting Documents</h2>
              <div className="space-y-2">
                {documents.map((d) => (
                  <a key={d.id} href={publicFileUrl(d.file_path) || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-navy-700 hover:bg-gray-50">
                    <FileText size={15} /> {d.file_name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {vessel.photograph && (
            <div className="card overflow-hidden p-0">
              <img src={publicFileUrl(vessel.photograph) || ""} alt="Vessel" className="h-48 w-full object-cover" />
            </div>
          )}

          <div className="card p-5">
            <h2 className="mb-3 font-display text-base font-semibold text-navy-950">Expiry Information</h2>
            <div className="space-y-4">
              <div>
                <div className="mb-1 text-xs font-mono-reg uppercase tracking-wide text-gray-400">Annual Fee</div>
                <div className="text-sm font-medium text-navy-950">{formatDate(vessel.annualFeeExpiry)}</div>
                <div className="mt-1.5"><StatusBadge status={vessel.status.annualFee} daysRemaining={daysRemaining(vessel.annualFeeExpiry)} /></div>
              </div>
              <div>
                <div className="mb-1 text-xs font-mono-reg uppercase tracking-wide text-gray-400">Insurance</div>
                <div className="text-sm font-medium text-navy-950">{formatDate(vessel.insuranceExpiry)}</div>
                <div className="mt-1.5"><StatusBadge status={vessel.status.insurance} daysRemaining={daysRemaining(vessel.insuranceExpiry)} /></div>
              </div>
              <div>
                <div className="mb-1 text-xs font-mono-reg uppercase tracking-wide text-gray-400">Roadworthiness</div>
                <div className="text-sm font-medium text-navy-950">{formatDate(vessel.roadworthinessExpiry)}</div>
                <div className="mt-1.5"><StatusBadge status={vessel.status.roadworthiness} daysRemaining={daysRemaining(vessel.roadworthinessExpiry)} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this vessel?"
        message={`This will permanently remove vessel ${vessel.registrationNumber} from the Dhaftharu. This action cannot be undone.`}
        confirmLabel="Delete Vessel"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </AppLayout>
  );
}
