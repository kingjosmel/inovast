"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Building2,
  Bike,
  CreditCard,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";

export interface PayoutRecord {
  id: string;
  recipientName: string;
  recipientType: "MERCHANT" | "RIDER" | string;
  recipientId: string;
  accountNumber: string;
  bankName: string;
  periodRange: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | string;
  paystackTransferCode?: string | null;
  createdAt: string;
}

interface PayoutsTableProps {
  payouts: PayoutRecord[];
  onActionComplete?: () => void;
}

export function PayoutsTable({ payouts: initialPayouts, onActionComplete }: PayoutsTableProps) {
  const [payouts, setPayouts] = useState<PayoutRecord[]>(initialPayouts);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const filteredPayouts = payouts.filter((p) => {
    const matchesSearch =
      p.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.paystackTransferCode && p.paystackTransferCode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === "ALL" || p.recipientType === typeFilter;
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredPayouts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPayouts.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSingleAction = async (payoutId: string, action: "APPROVE" | "HOLD") => {
    setProcessingId(payoutId);
    setNotification(null);

    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, action }),
      });
      const data = await res.json();

      if (data.success) {
        setPayouts((prev) =>
          prev.map((p) =>
            p.id === payoutId
              ? {
                  ...p,
                  status: action === "APPROVE" ? "SUCCESS" : "FAILED",
                  paystackTransferCode: data.transferCodes?.[payoutId] || "TRF_MANUAL",
                }
              : p
          )
        );
        setNotification({
          message: action === "APPROVE" ? "Paystack transfer executed successfully." : "Payout placed on compliance hold.",
          type: "success",
        });
        onActionComplete?.();
      } else {
        setNotification({ message: data.error || "Failed to process payout", type: "error" });
      }
    } catch {
      setNotification({ message: "Network error processing payout", type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0 || isBatchProcessing) return;
    setIsBatchProcessing(true);
    setNotification(null);

    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutIds: selectedIds, action: "BATCH_APPROVE" }),
      });
      const data = await res.json();

      if (data.success) {
        setPayouts((prev) =>
          prev.map((p) =>
            selectedIds.includes(p.id)
              ? {
                  ...p,
                  status: "SUCCESS",
                  paystackTransferCode: data.transferCodes?.[p.id] || "TRF_BATCH",
                }
              : p
          )
        );
        setNotification({
          message: `Successfully executed batch Paystack transfers for ${selectedIds.length} recipient(s).`,
          type: "success",
        });
        setSelectedIds([]);
        onActionComplete?.();
      } else {
        setNotification({ message: data.error || "Failed to execute batch payouts", type: "error" });
      }
    } catch {
      setNotification({ message: "Batch payout transfer network error", type: "error" });
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const selectedTotalAmount = payouts
    .filter((p) => selectedIds.includes(p.id))
    .reduce((sum, curr) => sum + curr.amount, 0);

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-semibold ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-500 hover:text-slate-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action Controls & Batch Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search recipient, bank, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-slate-900 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="MERCHANT">Merchants Only</option>
            <option value="RIDER">Riders Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-slate-900 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="SUCCESS">Transferred (Success)</option>
            <option value="FAILED">Held / Failed</option>
          </select>

          {/* Batch Execute Button */}
          {selectedIds.length > 0 && (
            <button
              type="button"
              id="batch-execute-payouts-btn"
              onClick={handleBatchApprove}
              disabled={isBatchProcessing}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 active:scale-95 transition disabled:opacity-50"
            >
              {isBatchProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 text-emerald-400" />
              )}
              <span>
                Batch Pay {selectedIds.length} (₦{selectedTotalAmount.toLocaleString()})
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredPayouts.length > 0 &&
                      selectedIds.length === filteredPayouts.length
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                </th>
                <th className="px-4 py-3.5">Recipient</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Settlement Period</th>
                <th className="px-4 py-3.5">Net Payout Amount</th>
                <th className="px-4 py-3.5">Transfer Code / Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No payout records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isRowProcessing = processingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`transition hover:bg-slate-50/80 ${
                        isSelected ? "bg-violet-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(item.id)}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                      </td>

                      {/* Recipient */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              item.recipientType === "MERCHANT"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-cyan-100 text-cyan-700"
                            }`}
                          >
                            {item.recipientType === "MERCHANT" ? (
                              <Building2 className="h-4 w-4" />
                            ) : (
                              <Bike className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{item.recipientName}</p>
                            <p className="text-[11px] text-slate-400">
                              {item.bankName} • {item.accountNumber}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            item.recipientType === "MERCHANT"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-cyan-50 text-cyan-700 border border-cyan-200"
                          }`}
                        >
                          {item.recipientType}
                        </span>
                      </td>

                      {/* Period */}
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {item.periodRange}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          ₦{item.amount.toLocaleString()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {item.status === "SUCCESS" ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              SUCCESS
                            </span>
                            {item.paystackTransferCode && (
                              <p className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                                {item.paystackTransferCode}
                              </p>
                            )}
                          </div>
                        ) : item.status === "FAILED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                            <XCircle className="h-3 w-3 text-rose-600" />
                            HELD / FAILED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                            <Clock className="h-3 w-3 text-amber-600" />
                            PENDING
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3.5 text-right">
                        {item.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSingleAction(item.id, "APPROVE")}
                              disabled={isRowProcessing}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-500 active:scale-95 transition disabled:opacity-50"
                            >
                              {isRowProcessing ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CreditCard className="h-3 w-3" />
                              )}
                              <span>Approve & Transfer</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSingleAction(item.id, "HOLD")}
                              disabled={isRowProcessing}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-rose-600 active:scale-95 transition disabled:opacity-50"
                            >
                              Hold
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-400">Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
