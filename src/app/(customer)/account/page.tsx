"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ArrowRight, Mail, MapPin, Package, Phone, UserRound } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function CustomerAccountPage() {
  const { data: session } = useSession();
  const [accountUser, setAccountUser] = useState(session?.user);

  useEffect(() => {
    fetch("/api/customer/account")
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json();
        return data.user;
      })
      .then((user) => {
        if (user) setAccountUser(user);
      })
      .catch(() => {
        // The session values remain visible if the profile request fails.
      });
  }, [session?.user]);

  const user = accountUser;

  return (
    <RoleGuard allowedRoles={["CUSTOMER"]}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm font-semibold text-orange-600">Your account</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Welcome, {user?.name || "Customer"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage your profile and keep track of your FoodGo orders.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <UserRound className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-900">Personal information</h2>
              <p className="text-sm text-slate-500">Your FoodGo customer profile</p>
            </div>
          </div>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <UserRound className="h-4 w-4" /> Full name
              </dt>
              <dd className="mt-2 font-semibold text-slate-900">{user?.name || "Not provided"}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Mail className="h-4 w-4" /> Email
              </dt>
              <dd className="mt-2 truncate font-semibold text-slate-900">{user?.email || "Not provided"}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Phone className="h-4 w-4" /> Phone
              </dt>
              <dd className="mt-2 font-semibold text-slate-900">{user?.phone || "Not provided"}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <MapPin className="h-4 w-4" /> Account type
              </dt>
              <dd className="mt-2 font-semibold capitalize text-slate-900">{user?.role?.toLowerCase() || "customer"}</dd>
            </div>
          </dl>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/orders" className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md">
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <Package className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-bold text-slate-900">My orders</span>
                <span className="block text-xs text-slate-500">View your order history</span>
              </span>
            </span>
            <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-orange-500" />
          </Link>
          <Link href="/" className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md">
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <MapPin className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-bold text-slate-900">Order food</span>
                <span className="block text-xs text-slate-500">Browse nearby restaurants</span>
              </span>
            </span>
            <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-orange-500" />
          </Link>
        </div>
      </div>
    </RoleGuard>
  );
}