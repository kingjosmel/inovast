import type { Session } from "next-auth";

import { auth } from "../../auth";

export async function requireRole(allowedRoles: string[]): Promise<Session | null> {
  const session = await auth();
  const role = session?.user?.role;

  if (!session || !role || !allowedRoles.includes(role)) {
    return null;
  }

  return session;
}