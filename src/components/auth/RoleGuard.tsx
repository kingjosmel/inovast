"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type UserRole = "CUSTOMER" | "MERCHANT_ADMIN" | "RIDER" | "SUPER_ADMIN";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role) {
      const userRole = session.user.role as UserRole;

      if (!allowedRoles.includes(userRole)) {
        // Redirect to appropriate portal based on role
        if (userRole === "CUSTOMER") {
          router.push("/");
        } else if (userRole === "MERCHANT_ADMIN") {
          router.push("/merchant");
        } else if (userRole === "RIDER") {
          router.push("/rider");
        } else if (userRole === "SUPER_ADMIN") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    }
  }, [status, session, allowedRoles, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 p-6 animate-pulse">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-200" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-3 w-20 rounded bg-slate-100" />
              </div>
            </div>
            <div className="h-8 w-24 rounded-full bg-slate-200" />
          </div>

          {/* Body skeleton cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-7 w-36 rounded bg-slate-300" />
                <div className="h-3 w-16 rounded bg-slate-100" />
              </div>
            ))}
          </div>

          {/* Main content placeholder */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="h-28 rounded-lg bg-slate-100" />
            <div className="h-28 rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (status === "authenticated" && session?.user?.role) {
    const userRole = session.user.role as UserRole;
    if (!allowedRoles.includes(userRole)) {
      return null;
    }
  }

  return <>{children}</>;
}
