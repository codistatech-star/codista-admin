import { Role } from "@prisma/client";
import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

declare module "next-auth" {
  interface User {
    role: Role;
    branchIds: string[];
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      branchIds: string[];
      activeBranchId?: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role;
    branchIds?: string[];
    activeBranchId?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          include: { branches: true },
        });
        if (!user || !user.isActive) return null;

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          branchIds: user.branches.map((b) => b.branchId),
        };
      },
    }),
  ],
});
