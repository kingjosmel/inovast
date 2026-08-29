"use client";

import { useState } from "react";
import {
  Percent,
  Phone,
  Store,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface MerchantOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MerchantOnboardingModal({
  isOpen,
  onClose,
  onSuccess,
}: MerchantOnboardingModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    cuisineCategory: "African & Continental",
    logoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150",
    coverImageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
    commissionRate: "15",
    branchName: "",
    city: "Lagos",
    area: "Victoria Island",
    address: "",
    latitude: "6.4281",
    longitude: "3.4246",
    phone: "",
    baseDeliveryFee: "800",
    perKmRate: "150",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-");
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug === "" || prev.slug === val.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, -1) ? slug : prev.slug,
      branchName: prev.branchName === "" ? `${val} - Main Branch` : prev.branchName,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          commissionRate: parseFloat(formData.commissionRate) / 100,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          baseDeliveryFee: parseFloat(formData.baseDeliveryFee),
          perKmRate: parseFloat(formData.perKmRate),
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(data.error || "Failed to onboard merchant");
      }
    } catch {
      setError("Network error while onboarding merchant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white font-bold shadow-xs">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Onboard Restaurant Partner</h3>
              <p className="text-xs text-slate-500">Register brand and launch initial kitchen branch</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* Brand Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Brand Identity & Commission
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Restaurant Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mega Chicken"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. mega-chicken"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cuisine / Category
                </label>
                <select
                  value={formData.cuisineCategory}
                  onChange={(e) => setFormData({ ...formData, cuisineCategory: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
                >
                  <option value="African & Continental">African & Continental</option>
                  <option value="Fast Food & Grills">Fast Food & Grills</option>
                  <option value="Pizza & Pasta">Pizza & Pasta</option>
                  <option value="Asian & Sushi">Asian & Sushi</option>
                  <option value="Bakery & Desserts">Bakery & Desserts</option>
                  <option value="Healthy & Salads">Healthy & Salads</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Commission Rate (%) *</span>
                  <span className="text-amber-600 font-bold">{formData.commissionRate}%</span>
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="0.5"
                    required
                    placeholder="15"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs font-bold focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Branch & Location Info */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              2. Branch Location & Dispatch Rates
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Victoria Island Outlet"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dispatch Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+234 802 345 6789"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Zone / Area *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Victoria Island"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Physical Kitchen Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 14 Adeola Odeku Street, Victoria Island"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Base Delivery Fee (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.baseDeliveryFee}
                  onChange={(e) => setFormData({ ...formData, baseDeliveryFee: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono font-bold focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Per-Km Rate (₦/km)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.perKmRate}
                  onChange={(e) => setFormData({ ...formData, perKmRate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono font-bold focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
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
              id="confirm-onboard-merchant-btn"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>Onboard Restaurant & Branch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
