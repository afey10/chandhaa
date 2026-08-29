import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import * as rpc from "../../api/rpc";
import { getErrorMessage, publicFileUrl } from "../../api/rpc";
import { useToast } from "../../components/Toast";
import { Category } from "../../types";

interface FormState {
  registrationNumber: string; categoryId: string; vesselName: string; builder: string; model: string; year: string;
  colour: string; engineNumber: string; hullNumber: string; length: string; width: string; ownerFullName: string;
  ownerIdCard: string; ownerAddress: string; contactNumber: string; annualFeeExpiry: string; insuranceExpiry: string;
  roadworthinessExpiry: string; remarks: string;
}

const EMPTY: FormState = {
  registrationNumber: "", categoryId: "", vesselName: "", builder: "", model: "", year: "", colour: "", engineNumber: "",
  hullNumber: "", length: "", width: "", ownerFullName: "", ownerIdCard: "", ownerAddress: "", contactNumber: "",
  annualFeeExpiry: "", insuranceExpiry: "", roadworthinessExpiry: "", remarks: "",
};

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100";

export default function VesselFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [photo, setPhoto] = useState<File | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    rpc.listVesselCategories().then((items: any) => setCategories(items));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    rpc
      .getVessel(id!)
      .then((res) => {
        const v = res.vessel;
        setForm({
          registrationNumber: v.registrationNumber, categoryId: v.categoryId, vesselName: v.vesselName || "",
          builder: v.builder || "", model: v.model || "", year: v.year?.toString() || "", colour: v.colour || "",
          engineNumber: v.engineNumber || "", hullNumber: v.hullNumber || "", length: v.length?.toString() || "",
          width: v.width?.toString() || "", ownerFullName: v.ownerFullName, ownerIdCard: v.ownerIdCard,
          ownerAddress: v.ownerAddress, contactNumber: v.contactNumber || "", annualFeeExpiry: v.annualFeeExpiry,
          insuranceExpiry: v.insuranceExpiry, roadworthinessExpiry: v.roadworthinessExpiry, remarks: v.remarks || "",
        });
        setExistingPhoto(v.photograph);
      })
      .catch((err) => showToast(getErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const update = (field: keyof FormState, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.registrationNumber.trim()) e.registrationNumber = "Registration number is required.";
    if (!form.categoryId) e.categoryId = "Please select a category.";
    if (!form.ownerFullName.trim()) e.ownerFullName = "Owner full name is required.";
    if (!form.ownerIdCard.trim()) e.ownerIdCard = "Owner ID card number is required.";
    if (!form.ownerAddress.trim()) e.ownerAddress = "Owner address is required.";
    if (!form.annualFeeExpiry) e.annualFeeExpiry = "Annual fee expiry date is required.";
    if (!form.insuranceExpiry) e.insuranceExpiry = "Insurance expiry date is required.";
    if (!form.roadworthinessExpiry) e.roadworthinessExpiry = "Roadworthiness expiry date is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      let photograph: string | undefined;
      if (photo) photograph = await rpc.uploadFile(photo, "vessels");

      const payload = { ...form, photograph };

      if (isEdit) {
        await rpc.updateVessel(id!, payload);
        showToast(`Vessel ${form.registrationNumber} has been updated.`);
        navigate(`/vessels/${id}`);
      } else {
        const res = await rpc.createVessel(payload);
        showToast(`Vessel ${form.registrationNumber} has been successfully added.`);
        navigate(`/vessels/${res.id}`);
      }
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <AppLayout><div className="py-20 text-center text-gray-400">Loading vessel…</div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-semibold text-navy-950">{isEdit ? "Edit Vessel" : "Add New Vessel"}</h1>
        <p className="mt-1 text-sm text-gray-500">Fields marked with an asterisk are required.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-navy-950">Vessel Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Registration Number" required>
                <input value={form.registrationNumber} onChange={(e) => update("registrationNumber", e.target.value.toUpperCase())} className={inputClass} placeholder="e.g. TV-V101" />
                {errors.registrationNumber && <p className="mt-1 text-xs text-red-600">{errors.registrationNumber}</p>}
              </Field>
              <Field label="Vessel Category" required>
                <select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)} className={inputClass}>
                  <option value="">Select category…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId}</p>}
              </Field>
              <Field label="Vessel Name"><input value={form.vesselName} onChange={(e) => update("vesselName", e.target.value)} className={inputClass} /></Field>
              <Field label="Make / Builder"><input value={form.builder} onChange={(e) => update("builder", e.target.value)} className={inputClass} /></Field>
              <Field label="Model / Type"><input value={form.model} onChange={(e) => update("model", e.target.value)} className={inputClass} /></Field>
              <Field label="Year"><input type="number" value={form.year} onChange={(e) => update("year", e.target.value)} className={inputClass} /></Field>
              <Field label="Colour"><input value={form.colour} onChange={(e) => update("colour", e.target.value)} className={inputClass} /></Field>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-navy-950">Owner Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Owner Full Name" required>
                <input value={form.ownerFullName} onChange={(e) => update("ownerFullName", e.target.value)} className={inputClass} />
                {errors.ownerFullName && <p className="mt-1 text-xs text-red-600">{errors.ownerFullName}</p>}
              </Field>
              <Field label="ID Card Number" required>
                <input value={form.ownerIdCard} onChange={(e) => update("ownerIdCard", e.target.value)} className={inputClass} />
                {errors.ownerIdCard && <p className="mt-1 text-xs text-red-600">{errors.ownerIdCard}</p>}
              </Field>
              <Field label="Address" required>
                <input value={form.ownerAddress} onChange={(e) => update("ownerAddress", e.target.value)} className={inputClass} />
                {errors.ownerAddress && <p className="mt-1 text-xs text-red-600">{errors.ownerAddress}</p>}
              </Field>
              <Field label="Contact Number"><input value={form.contactNumber} onChange={(e) => update("contactNumber", e.target.value)} className={inputClass} /></Field>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-navy-950">Legal / Expiry Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Annual Fee Expiry" required>
                <input type="date" value={form.annualFeeExpiry} onChange={(e) => update("annualFeeExpiry", e.target.value)} className={inputClass} />
                {errors.annualFeeExpiry && <p className="mt-1 text-xs text-red-600">{errors.annualFeeExpiry}</p>}
              </Field>
              <Field label="Insurance Expiry" required>
                <input type="date" value={form.insuranceExpiry} onChange={(e) => update("insuranceExpiry", e.target.value)} className={inputClass} />
                {errors.insuranceExpiry && <p className="mt-1 text-xs text-red-600">{errors.insuranceExpiry}</p>}
              </Field>
              <Field label="Roadworthiness Expiry" required>
                <input type="date" value={form.roadworthinessExpiry} onChange={(e) => update("roadworthinessExpiry", e.target.value)} className={inputClass} />
                {errors.roadworthinessExpiry && <p className="mt-1 text-xs text-red-600">{errors.roadworthinessExpiry}</p>}
              </Field>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-navy-950">Optional Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Engine Number"><input value={form.engineNumber} onChange={(e) => update("engineNumber", e.target.value)} className={inputClass} /></Field>
              <Field label="Hull Number"><input value={form.hullNumber} onChange={(e) => update("hullNumber", e.target.value)} className={inputClass} /></Field>
              <Field label="Length (m)"><input type="number" step="0.1" value={form.length} onChange={(e) => update("length", e.target.value)} className={inputClass} /></Field>
              <Field label="Width (m)"><input type="number" step="0.1" value={form.width} onChange={(e) => update("width", e.target.value)} className={inputClass} /></Field>
              <div className="sm:col-span-2">
                <Field label="Remarks"><textarea value={form.remarks} onChange={(e) => update("remarks", e.target.value)} rows={3} className={inputClass} /></Field>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Vessel Photograph</label>
                {existingPhoto && !photo && (
                  <img src={publicFileUrl(existingPhoto) || ""} alt="Current vessel" className="mb-2 h-28 w-28 rounded-lg object-cover" />
                )}
                <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                  <Upload size={15} />
                  {photo ? photo.name : "Choose image (JPG, PNG, WEBP)"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-navy-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60">
              {submitting ? "Saving…" : isEdit ? "Save Changes" : "Add Vessel"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
