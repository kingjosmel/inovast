"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Store,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  MapPin,
  TrendingUp,
  RefreshCw,
  Edit2,
  Check,
  Building2,
} from "lucide-react";
import { MerchantOnboardingModal } from "@/components/admin/MerchantOnboardingModal";

interface MerchantItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  coverImageUrl: string;
  commissionRate: number;
  isActive: boolean;
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | string;
  branchesCount: number;
  primaryCity: string;
  primaryArea: string;
  phone: string;
  totalOrders: number;
  gmv: number;
  createdAt: string;
}

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<MerchantItem[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);

  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editRateValue, setEditRateValue] = useState<string>("15");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchMerchants = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/merchants");
      const json = await res.json();
      if (json.success && json.merchants) {
        setMerchants(json.merchants);
      }
    } catch (err) {
      console.error("Failed to load merchants:", err);
    } finally {
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/merchants");
        const json = await res.json();
        if (!ignore && json.success && json.merchants) {
          setMerchants(json.merchants);
        }
      } catch (err) {
        console.error("Failed to load merchants:", err);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleToggleStatus = async (merchant: MerchantItem) => {
    const newStatus = merchant.isActive ? "SUSPENDED" : "ACTIVE";
    setUpdatingId(merchant.id);

    try {
      const res = await fetch("/api/admin/merchants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: merchant.id,
          isActive: !merchant.isActive,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMerchants((prev) =>
          prev.map((m) =>
            m.id === merchant.id
              ? {
                  ...m,
                  isActive: !m.isActive,
                  status: newStatus,
                }
              : m
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveCommissionRate = async (merchantId: string) => {
    setUpdatingId(merchantId);
    try {
      const rateNum = parseFloat(editRateValue) / 100;
      const res = await fetch("/api/admin/merchants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId,
          commissionRate: rateNum,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMerchants((prev) =>
          prev.map((m) =>
            m.id === merchantId
              ? {
                  ...m,
                  commissionRate: rateNum,
                }
              : m
          )
        );
        setEditingRateId(null);
      }
    } catch (err) {
      console.error("Failed to update rate:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.primaryArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && m.isActive) ||
      (statusFilter === "SUSPENDED" && !m.isActive);

    return matchesSearch && matchesStatus;
  });

  const totalGmv = merchants.reduce((sum, m) => sum + m.gmv, 0);
  const activeCount = merchants.filter((m) => m.isActive).length;
  const avgCommission =
    merchants.length > 0
      ? (
          merchants.reduce((sum, m) => sum + m.commissionRate, 0) / merchants.length
        ) * 100
      : 15;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-xs">
              <Store className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Merchant & Vendor Directory
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage partner restaurant onboarding, custom commission rates, and branch operational statuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchMerchants(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            id="onboard-new-merchant-btn"
            onClick={() => setOnboardingOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition active:scale-95 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Onboard Merchant</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Partners
          </span>
          <p className="mt-2 font-mono text-2xl font-black text-slate-900">
            {merchants.length} Brands
          </p>
          <p className="mt-1 text-[11px] text-slate-500">{activeCount} actively taking orders</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Kitchens
          </span>
          <p className="mt-2 font-mono text-2xl font-black text-emerald-600">
            {activeCount} Live
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <CheckCircle2 className="h-3 w-3" />
            <span>Dispatch enabled</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Avg Commission Fee
          </span>
          <p className="mt-2 font-mono text-2xl font-black text-violet-600">
            {avgCommission.toFixed(1)}%
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Platform take-rate per order</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Merchant GMV
          </span>
          <p className="mt-2 font-mono text-2xl font-black text-slate-900">
            ₦{totalGmv.toLocaleString()}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <TrendingUp className="h-3 w-3" />
            <span>Aggregate sales volume</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by restaurant name, area, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-slate-900 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Merchants Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Restaurant Brand</th>
                <th className="px-4 py-3.5">Primary Location</th>
                <th className="px-4 py-3.5">Branches</th>
                <th className="px-4 py-3.5">Commission Rate</th>
                <th className="px-4 py-3.5">Total GMV</th>
                <th className="px-4 py-3.5">Operational Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredMerchants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No merchants found matching your query.
                  </td>
                </tr>
              ) : (
                filteredMerchants.map((m) => {
                  const isEditingRate = editingRateId === m.id;

                  return (
                    <tr key={m.id} className="transition hover:bg-slate-50/80">
                      {/* Brand Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold overflow-hidden border border-amber-200">
                            {m.logoUrl ? (
                              <div
                                style={{ backgroundImage: `url(${m.logoUrl})` }}
                                className="h-full w-full bg-cover bg-center"
                              />
                            ) : (
                              <Store className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{m.name}</p>
                            <p className="text-[11px] font-mono text-slate-400">/{m.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span>{m.primaryArea}</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{m.primaryCity} • {m.phone}</p>
                        </div>
                      </td>

                      {/* Branches */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                          <Building2 className="h-3 w-3" />
                          {m.branchesCount} {m.branchesCount === 1 ? "branch" : "branches"}
                        </span>
                      </td>

                      {/* Commission Rate */}
                      <td className="px-4 py-4">
                        {isEditingRate ? (
                          <div className="flex items-center gap-1.5">
                            <div className="relative w-20">
                              <input
                                type="number"
                                min="1"
                                max="50"
                                step="0.5"
                                value={editRateValue}
                                onChange={(e) => setEditRateValue(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold focus:border-slate-900 focus:outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveCommissionRate(m.id)}
                              className="rounded-lg bg-slate-900 p-1.5 text-white hover:bg-slate-800"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRateId(null)}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-900">
                              {(m.commissionRate * 100).toFixed(1)}%
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRateId(m.id);
                                setEditRateValue((m.commissionRate * 100).toString());
                              }}
                              className="text-slate-400 hover:text-slate-700"
                              title="Edit Commission Rate"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* GMV */}
                      <td className="px-4 py-4">
                        <span className="font-mono font-bold text-slate-900">
                          ₦{m.gmv.toLocaleString()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        {m.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                            <XCircle className="h-3 w-3 text-rose-600" />
                            SUSPENDED
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(m)}
                          disabled={updatingId === m.id}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 disabled:opacity-50 ${
                            m.isActive
                              ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                              : "bg-slate-900 text-white hover:bg-slate-800"
                          }`}
                        >
                          {m.isActive ? "Suspend Store" : "Activate Store"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboarding Modal */}
      <MerchantOnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onSuccess={() => fetchMerchants(true)}
      />
    </div>
  );
}
