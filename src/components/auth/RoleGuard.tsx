"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
          </div>
          <p className="text-sm font-medium text-slate-600">Loading...</p>
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
