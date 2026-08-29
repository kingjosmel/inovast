import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import "next-auth/jwt";
import { z } from "zod";

import type { UserRole } from "@/models/User";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    activeBranchId?: string;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      activeBranchId?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    activeBranchId?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "foodgo_fallback_jwt_secret_token_1234567890",
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = credentialsSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const email = parsedCredentials.data.email.toLowerCase().trim();
        const password = parsedCredentials.data.password;

        let user;
        try {
          const [{ connectToDatabase: dbConnect }, { default: User }, bcryptModule] =
            await Promise.all([
              import("@/lib/db"),
              import("@/models/User"),
              import("bcryptjs"),
            ]);

          await dbConnect();

          user = await User.findOne({ email })
            .select("+passwordHash")
            .lean();

          if (!user) {
            console.warn(`[Auth] User not found for email: ${email}`);
            return null;
          }

          const bcrypt = (bcryptModule as { default?: { compare: typeof import("bcryptjs").compare } }).default || bcryptModule;
          const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

          if (!isPasswordValid) {
            console.warn(`[Auth] Invalid password for email: ${email}`);
            return null;
          }
        } catch (err: unknown) {
          console.error("[Auth] Exception during authorize:", err);
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          activeBranchId: user.activeBranchId?.toString(),
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.activeBranchId = user.activeBranchId;
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = token.id ?? "";
      session.user.role = token.role ?? "CUSTOMER";

      if (token.activeBranchId) {
        session.user.activeBranchId = token.activeBranchId;
      }

      return session;
    },
  },
});
