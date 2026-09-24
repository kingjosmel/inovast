"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";

interface AddMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function AddMenuItemModal({ isOpen, onClose, onCreated }: AddMenuItemModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
  });

  if (!isOpen) return null;

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/merchant/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price), inStock: true }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to add menu item");
        return;
      }

      setForm({ title: "", description: "", price: "", category: "", imageUrl: "" });
      onCreated();
      onClose();
    } catch {
      setError("Unable to connect to the menu service");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add menu item</h2>
            <p className="mt-1 text-xs text-slate-500">Create a dish for your active branch.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm font-semibold text-slate-700">
            Item name
            <input required value={form.title} onChange={(e) => update("title", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:border-emerald-500" />
          </label>
          <label className="sm:col-span-2 text-sm font-semibold text-slate-700">
            Description
            <textarea required rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:border-emerald-500" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Price (NGN)
            <input required min="1" type="number" value={form.price} onChange={(e) => update("price", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:border-emerald-500" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Category
            <input required value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="Main meals" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:border-emerald-500" />
          </label>
          <label className="sm:col-span-2 text-sm font-semibold text-slate-700">
            Image URL <span className="font-normal text-slate-400">(optional)</span>
            <input type="url" value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} placeholder="https://..." className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:border-emerald-500" />
          </label>
        </div>

        {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <button type="submit" disabled={isSaving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {isSaving ? "Saving item..." : "Add menu item"}
        </button>
      </form>
    </div>
  );
}