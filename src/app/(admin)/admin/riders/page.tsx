"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bike,
  Plus,
  Search,
  CheckCircle2,
  Star,
  ShieldCheck,
  Zap,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { RiderManagementModal } from "@/components/admin/RiderManagementModal";

interface RiderItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  plateNumber: string;
  rating: number;
  completedTrips: number;
  dutyStatus: "ONLINE" | "OFFLINE" | string;
  verificationStatus: "VERIFIED" | "PENDING_VERIFICATION" | "SUSPENDED" | string;
  isVerified: boolean;
  currentZone: string;
  acceptanceRate: number;
  createdAt: string;
}

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<RiderItem[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRiders = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/riders");
      const json = await res.json();
      if (json.success && json.riders) {
        setRiders(json.riders);
      }
    } catch (err) {
      console.error("Failed to load riders:", err);
    } finally {
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/riders");
        const json = await res.json();
        if (!ignore && json.success && json.riders) {
          setRiders(json.riders);
        }
      } catch (err) {
        console.error("Failed to load riders:", err);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleToggleVerification = async (rider: RiderItem) => {
    setUpdatingId(rider.id);
    const newVerified = !rider.isVerified;
    const newStatus = newVerified ? "VERIFIED" : "SUSPENDED";

    try {
      const res = await fetch("/api/admin/riders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riderId: rider.id,
          isVerified: newVerified,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRiders((prev) =>
          prev.map((r) =>
            r.id === rider.id
              ? {
                  ...r,
                  isVerified: newVerified,
                  verificationStatus: newStatus,
                }
              : r
          )
        );
      }
    } catch (err) {
      console.error("Failed to update rider verification:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredRiders = riders.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.plateNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ONLINE" && r.dutyStatus === "ONLINE") ||
      (statusFilter === "VERIFIED" && r.isVerified) ||
      (statusFilter === "SUSPENDED" && !r.isVerified);

    return matchesSearch && matchesStatus;
  });

  const totalRiders = riders.length;
  const onlineCount = riders.filter((r) => r.dutyStatus === "ONLINE").length;
  const verifiedCount = riders.filter((r) => r.isVerified).length;
  const avgRating =
    riders.length > 0
      ? riders.reduce((sum, r) => sum + r.rating, 0) / riders.length
      : 4.8;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-600 text-white font-bold shadow-xs">
              <Bike className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Delivery Fleet & Rider Operations
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor courier duty statuses, verify KYC documents, and enforce fleet quality ratings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchRiders(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            id="register-new-rider-btn"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition active:scale-95 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Register Rider</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Fleet Size
          </span>
          <p className="mt-2 font-mono text-2xl font-black text-slate-900">
            {totalRiders} Drivers
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Registered across Lagos metro</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Online on Duty
          </span>
          <p className="mt-2 font-mono text-2xl font-black text-cyan-600">
            {onlineCount} Couriers
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-cyan-600">
            <Zap className="h-3 w-3" />
            <span>Ready for dispatch</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            KYC Verified Rate
          </span>
          <p className="mt-2 font-mono text-2xl font-black text-emerald-600">
            {totalRiders > 0 ? Math.round((verifiedCount / totalRiders) * 100) : 100}%
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <ShieldCheck className="h-3 w-3" />
            <span>Vetted with background check</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Fleet Customer Rating
          </span>
          <div className="mt-2 flex items-center gap-2">
            <p className="font-mono text-2xl font-black text-slate-900">{avgRating.toFixed(2)}</p>
            <div className="flex text-amber-400">
              <Star className="h-5 w-5 fill-amber-400" />
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Based on customer feedback</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by rider name, plate, phone, email..."
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
            <option value="ALL">All Couriers</option>
            <option value="ONLINE">Online on Duty</option>
            <option value="VERIFIED">KYC Verified</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Fleet Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Courier Driver</th>
                <th className="px-4 py-3.5">Vehicle & Zone</th>
                <th className="px-4 py-3.5">Duty Status</th>
                <th className="px-4 py-3.5">Deliveries / Rating</th>
                <th className="px-4 py-3.5">KYC Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRiders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No riders found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredRiders.map((r) => {
                  return (
                    <tr key={r.id} className="transition hover:bg-slate-50/80">
                      {/* Driver */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800 font-bold border border-cyan-200">
                            <Bike className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{r.name}</p>
                            <p className="text-[11px] text-slate-400">{r.phone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle & Zone */}
                      <td className="px-4 py-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-800">
                            {r.vehicleType} • <span className="font-mono text-slate-500">{r.plateNumber}</span>
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <MapPin className="h-3 w-3" />
                            <span>{r.currentZone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Duty Status */}
                      <td className="px-4 py-4">
                        {r.dutyStatus === "ONLINE" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                            ONLINE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            OFFLINE
                          </span>
                        )}
                      </td>

                      {/* Deliveries & Rating */}
                      <td className="px-4 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-bold text-slate-900">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span>{r.rating.toFixed(2)}</span>
                            <span className="text-slate-400 text-[11px]">({r.acceptanceRate}% accept)</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {r.completedTrips} trips completed
                          </p>
                        </div>
                      </td>

                      {/* KYC Status */}
                      <td className="px-4 py-4">
                        {r.isVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            VERIFIED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                            PENDING KYC
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleVerification(r)}
                          disabled={updatingId === r.id}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 disabled:opacity-50 ${
                            r.isVerified
                              ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                              : "bg-slate-900 text-white hover:bg-slate-800"
                          }`}
                        >
                          {r.isVerified ? "Revoke / Suspend" : "Approve KYC"}
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

      {/* Modal */}
      <RiderManagementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => fetchRiders(true)}
      />
    </div>
  );
}
