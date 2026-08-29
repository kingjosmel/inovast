"use client";

import { useState } from "react";
import {
  Bike,
  User,
  Mail,
  Phone,
  Loader2,
  ShieldCheck,
} from "lucide-react";

interface RiderManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RiderManagementModal({
  isOpen,
  onClose,
  onSuccess,
}: RiderManagementModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    vehicleType: "Motorcycle",
    area: "Victoria Island",
    autoVerify: true,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/riders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(data.error || "Failed to onboard rider");
      }
    } catch {
      setError("Network error while onboarding rider");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white font-bold shadow-xs">
              <Bike className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Onboard Delivery Rider</h3>
              <p className="text-xs text-slate-500">Register new fleet partner & issue credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Legal Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Tunde Bakare"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="email"
                required
                placeholder="e.g. tunde.bakare@delivery.foodgo.ng"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="tel"
                required
                placeholder="+234 802 111 2233"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vehicle Type
              </label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
              >
                <option value="Motorcycle">Motorcycle (200cc)</option>
                <option value="Bicycle">Bicycle / Eco</option>
                <option value="Electric Scooter">Electric Scooter</option>
                <option value="Van / Car">Van / Car</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Zone
              </label>
              <select
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
              >
                <option value="Victoria Island">Victoria Island</option>
                <option value="Lekki Phase 1">Lekki Phase 1</option>
                <option value="Ikoyi">Ikoyi</option>
                <option value="Ikeja GRA">Ikeja GRA</option>
                <option value="Yaba">Yaba</option>
                <option value="Surulere">Surulere</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="autoVerifyRider"
              checked={formData.autoVerify}
              onChange={(e) => setFormData({ ...formData, autoVerify: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="autoVerifyRider" className="text-xs font-semibold text-slate-700">
              Approve KYC & Activate for dispatch immediately
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-onboard-rider-btn"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-cyan-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              <span>Register & Activate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
