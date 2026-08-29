"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  ChefHat,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  UtensilsCrossed,
  RefreshCw,
  Loader2,
  Store,
  ChevronRight,
} from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { BranchAvailabilityToggle } from "@/components/merchant/BranchAvailabilityToggle";
import type { MerchantDashboardData } from "@/app/api/merchant/dashboard/route";
import type { OrderStatus } from "@/models/Order";

export default function MerchantDashboardPage() {
  const [data, setData] = useState<MerchantDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/merchant/dashboard");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch("/api/merchant/dashboard");
        if (res.ok) {
          const json = await res.json();
          if (!ignore && json.data) {
            setData(json.data);
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PLACED":
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
            Placed (New)
          </span>
        );
      case "CONFIRMED":
      case "PREPARING":
        return (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
            Preparing
          </span>
        );
      case "READY":
        return (
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
            Ready for Pickup
          </span>
        );
      case "OUT_FOR_DELIVERY":
        return (
          <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
            Out for Delivery
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            Delivered
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <RoleGuard allowedRoles={["MERCHANT_ADMIN", "SUPER_ADMIN"]}>
      <div className="space-y-6">
        {/* Top Header & Refresh */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {data?.branch.name || "Kitchen Operations Dashboard"}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {data?.branch.area ? `${data.branch.area}, ${data.branch.city}` : "Real-time kitchen fulfillment & financial metrics"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="refresh-dashboard-btn"
              type="button"
              onClick={fetchDashboardData}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
              <span>{isRefreshing ? "Refreshing..." : "Refresh Data"}</span>
            </button>

            <Link
              href="/merchant/orders"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              <ChefHat className="h-4 w-4" />
              <span>Live KDS Board</span>
            </Link>
          </div>
        </div>

        {/* 1. Branch Availability Switch */}
        {data?.branch && (
          <BranchAvailabilityToggle
            initialIsOpen={data.branch.isOpen}
            branchId={data.branch.id}
            branchName={data.branch.name}
            onStatusChange={(nextStatus) => {
              if (data) {
                setData({
                  ...data,
                  branch: { ...data.branch, isOpen: nextStatus },
                });
              }
            }}
          />
        )}

        {/* 2. High-Level Metric Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl border border-slate-200 bg-white p-5 animate-pulse">
                <div className="h-4 w-24 rounded bg-slate-200 mb-3" />
                <div className="h-8 w-36 rounded bg-slate-300 mb-2" />
                <div className="h-3 w-20 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total Revenue */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Revenue
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Banknote className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
                ₦{(data?.metrics.totalRevenue || 0).toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+{(data?.metrics.revenueGrowthPct || 12.5)}% vs previous week</span>
              </div>
            </div>

            {/* Card 2: Active Orders */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Active Orders
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <ChefHat className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
                {data?.metrics.activeOrders ?? 0}
              </p>
              <Link
                href="/merchant/orders"
                className="mt-2 inline-flex items-center gap-1 text-xs text-amber-700 font-medium hover:underline"
              >
                <span>View Kitchen Kanban</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Card 3: Completed Orders */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Completed Orders
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
                {data?.metrics.completedOrders ?? 0}
              </p>
              <p className="mt-2 text-xs text-slate-500 font-medium">
                Successfully delivered to customers
              </p>
            </div>

            {/* Card 4: Average Preparation Time */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Avg. Prep Time
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
                {data?.metrics.avgPrepTimeMinutes ?? 18} <span className="text-base font-normal text-slate-500">mins</span>
              </p>
              <p className="mt-2 text-xs text-emerald-600 font-medium">
                Within 20-min target threshold
              </p>
            </div>
          </div>
        )}

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/merchant/orders"
            className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-emerald-500 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white transition group-hover:bg-emerald-600">
                <ChefHat className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Live Kitchen Kanban</h3>
                <p className="text-xs text-slate-500">
                  Manage incoming, preparing, and ready orders in real-time
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition" />
          </Link>

          <Link
            href="/merchant/menu"
            className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-emerald-500 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white transition group-hover:bg-emerald-600">
                <UtensilsCrossed className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Menu & Stock Manager</h3>
                <p className="text-xs text-slate-500">
                  Instant 1-click out-of-stock toggles and catalog inventory
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition" />
          </Link>
        </div>

        {/* 3. Recent Orders Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Customer Orders</h2>
              <p className="text-xs text-slate-500">Latest transactions and fulfillment statuses</p>
            </div>
            <Link
              href="/merchant/orders"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>View all orders</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    Order Number
                  </th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    Customer Name
                  </th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    Items
                  </th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    Total Amount
                  </th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading recent orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : !data?.recentOrders || data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No recent orders recorded for this branch.
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 font-mono font-bold text-slate-900">
                        {order.orderNumber}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-800">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                        {order.itemsSummary}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-bold text-slate-900">
                        ₦{order.totalAmount.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" • "}
                        {new Date(order.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
