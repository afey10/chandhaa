import React from "react";
import { useNavigate } from "react-router-dom";
import { Car, Anchor, ArrowRight } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import { useAuth } from "../context/AuthContext";

export default function MainDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold text-navy-950">Welcome, {user?.fullName?.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-gray-500">Choose a registry to continue.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <button
            onClick={() => navigate("/vehicles")}
            className="card group relative overflow-hidden p-8 text-left transition hover:border-navy-300 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-navy-950 text-gold-400">
              <Car size={26} />
            </div>
            <h2 className="mt-5 font-display text-xl font-semibold text-navy-950">Vehicles</h2>
            <p className="mt-1 text-sm text-gray-500">Registry of motorcycles, cars, vans, trucks and buses.</p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-navy-700">
              Open Vehicle Dashboard <ArrowRight size={15} className="transition group-hover:translate-x-1" />
            </div>
          </button>

          <button
            onClick={() => navigate("/vessels")}
            className="card group relative overflow-hidden p-8 text-left transition hover:border-navy-300 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-navy-950 text-gold-400">
              <Anchor size={26} />
            </div>
            <h2 className="mt-5 font-display text-xl font-semibold text-navy-950">Vessels</h2>
            <p className="mt-1 text-sm text-gray-500">Registry of dhonis, fishing vessels, speedboats and yachts.</p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-navy-700">
              Open Vessel Dashboard <ArrowRight size={15} className="transition group-hover:translate-x-1" />
            </div>
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
