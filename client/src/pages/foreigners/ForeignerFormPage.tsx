import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, User } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import * as rpc from "../../api/rpc";
import { getErrorMessage, publicFileUrl } from "../../api/rpc";
import { useToast } from "../../components/Toast";
import { COUNTRIES } from "../../utils/countries";

interface FormState {
  fullName: string; country: string; passportNumber: string; passportExpiryDate: string;
  workVisaNumber: string; workVisaExpiryDate: string; contactNumber: string; presentAddress: string;
  workPlace: string; sponsor: string; occupation: string; durationInIsland: string; durationInMaldives: string;
}

const EMPTY: FormState = {
  fullName: "", country: "", passportNumber: "", passportExpiryDate: "", workVisaNumber: "", workVisaExpiryDate: "",
  contactNumber: "", presentAddress: "", workPlace: "", sponsor: "", occupation: "", durationInIsland: "", durationInMaldives: "",
};

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100";

export default function ForeignerFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    rpc
      .getForeigner(id!)
      .then((res) => {
        const f = res.foreigner;
        setForm({
          fullName: f.fullName, country: f.country, passportNumber: f.passportNumber, passportExpiryDate: f.passportExpiryDate || "",
          workVisaNumber: f.workVisaNumber, workVisaExpiryDate: f.workVisaExpiryDate || "", contactNumber: f.contactNumber || "",
          presentAddress: f.presentAddress || "", workPlace: f.workPlace || "", sponsor: f.sponsor || "",
          occupation: f.occupation || "", durationInIsland: f.durationInIsland || "", durationInMaldives: f.durationInMaldives || "",
        });
        setExistingPhoto(f.photoUrl);
      })
      .catch((err) => showToast(getErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const update = (field: keyof FormState, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handlePhotoChange = (file: File | null) => {
    if (!file) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setErrors((e) => ({ ...e, photo: "Only JPG, JPEG and PNG images are supported." }));
      return;
    }
    setErrors((e) => { const n = { ...e }; delete n.photo; return n; });
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!form.country) e.country = "Country is required.";
    if (!form.passportNumber.trim()) e.passportNumber = "Passport number is required.";
    if (!form.workVisaNumber.trim()) e.workVisaNumber = "Work visa number is required.";
    if (!isEdit && !photo) e.photo = "A person photo is required.";
    setErrors((prev) => ({ ...prev, ...e }));
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      let photoUrl: string | undefined;
      if (photo) photoUrl = await rpc.uploadFile(photo, "foreigners");

      const payload = { ...form, photoUrl };

      if (isEdit) {
        await rpc.updateForeigner(id!, payload);
        showToast(`${form.fullName} has been updated.`);
        navigate(`/bidheyseenge/foreigners/${id}`);
      } else {
        const res = await rpc.createForeigner(payload);
        showToast(`${form.fullName} has been successfully registered.`);
        navigate(`/bidheyseenge/foreigners/${res.id}`);
      }
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <AppLayout><div className="py-20 text-center text-gray-400">Loading foreigner record…</div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-semibold text-navy-950">{isEdit ? "Edit Foreigner" : "Add Foreigner"}</h1>
        <p className="mt-1 text-sm text-gray-500">Fields marked with an asterisk are required.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-navy-950">Personal Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name" required>
                <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className={inputClass} />
                {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
              </Field>
              <Field label="Country" required>
                <select value={form.country} onChange={(e) => update("country", e.target.value)} className={inputClass}>
                  <option value="">Select country…</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country}</p>}
              </Field>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Person Photo {!isEdit && <span className="text-red-500">*</span>}</label>
                <div className="flex items-center gap-4">
                  {(photoPreview || existingPhoto) ? (
                    <img src={photoPreview || publicFileUrl(existingPhoto) || ""} alt="Preview" className="h-20 w-20 rounded-full border border-gray-200 object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-300">
                      <User size={28} />
                    </div>
                  )}
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                    <Upload size={15} />
                    {photo ? photo.name : "Choose photo (JPG, JPEG, PNG)"}
                    <input type="file" accept="image/jpeg,image/jpg,image/png" className="hidden" onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)} />
                  </label>
                </div>
                {errors.photo && <p className="mt-1 text-xs text-red-600">{errors.photo}</p>}
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-navy-950">Passport Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Passport Number" required>
                <input value={form.passportNumber} onChange={(e) => update("passportNumber", e.target.value.toUpperCase())} className={inputClass} />
                {errors.passportNumber && <p className="mt-1 text-xs text-red-600">{errors.passportNumber}</p>}
              </Field>
              <Field label="Passport Expiry Date">
                <input type="date" value={form.passportExpiryDate} onChange={(e) => update("passportExpiryDate", e.target.value)} className={inputClass} />
                {errors.passportExpiryDate && <p className="mt-1 text-xs text-red-600">{errors.passportExpiryDate}</p>}
              </Field>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-navy-950">Visa Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Work Visa Number" required>
                <input value={form.workVisaNumber} onChange={(e) => update("workVisaNumber", e.target.value.toUpperCase())} className={inputClass} />
                {errors.workVisaNumber && <p className="mt-1 text-xs text-red-600">{errors.workVisaNumber}</p>}
              </Field>
              <Field label="Work Visa Expiry Date">
                <input type="date" value={form.workVisaExpiryDate} onChange={(e) => update("workVisaExpiryDate", e.target.value)} className={inputClass} />
                {errors.workVisaExpiryDate && <p className="mt-1 text-xs text-red-600">{errors.workVisaExpiryDate}</p>}
              </Field>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-navy-950">Contact Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Contact Number"><input value={form.contactNumber} onChange={(e) => update("contactNumber", e.target.value)} className={inputClass} /></Field>
              <div className="sm:col-span-2">
                <Field label="Present Address"><textarea value={form.presentAddress} onChange={(e) => update("presentAddress", e.target.value)} rows={2} className={inputClass} /></Field>
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-navy-950">Employment Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Work Place"><input value={form.workPlace} onChange={(e) => update("workPlace", e.target.value)} className={inputClass} /></Field>
              <Field label="Sponsor"><input value={form.sponsor} onChange={(e) => update("sponsor", e.target.value)} className={inputClass} /></Field>
              <Field label="Occupation"><input value={form.occupation} onChange={(e) => update("occupation", e.target.value)} className={inputClass} /></Field>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-navy-950">Duration Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Duration in the Island">
                <input value={form.durationInIsland} onChange={(e) => update("durationInIsland", e.target.value)} placeholder="e.g. 6 months" className={inputClass} />
              </Field>
              <Field label="Duration in Maldives">
                <input value={form.durationInMaldives} onChange={(e) => update("durationInMaldives", e.target.value)} placeholder="e.g. 2 years" className={inputClass} />
              </Field>
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-navy-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60">
              {submitting ? "Saving…" : isEdit ? "Save Changes" : "Add Foreigner"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
