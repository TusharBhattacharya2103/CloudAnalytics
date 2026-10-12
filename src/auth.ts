import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const { auth, handlers, signIn, signOut } = NextAuth({
  pages: { signIn: "/signin" },
  session: { strategy: "jwt" },
  providers: [Credentials({
    name: "Email and password",
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "").trim().toLowerCase();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;
      const [rows] = await db.query<Array<{ id: number; name: string; email: string; password: string; role: string; is_active: number }>>(
        "SELECT id, name, email, password, role, is_active FROM users WHERE email=? LIMIT 1", [email],
      );
      const user = rows[0];
      if (!user || !user.is_active || !["super_admin", "admin", "sales_executive"].includes(user.role)) return null;
      if (!(await bcrypt.compare(password, user.password))) return null;
      return { id: String(user.id), name: user.name, email: user.email, role: user.role };
    },
  })],
  callbacks: {
    async authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      if (pathname === "/signup") return NextResponse.redirect(new URL("/signin", request.nextUrl));
      return pathname === "/signin" || pathname.startsWith("/api/auth") || !!auth;
    },
    async jwt({ token, user }) {
      if (user) { token.userId = user.id; token.role = (user as typeof user & { role?: string }).role; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { session.user.id = String(token.userId ?? ""); session.user.role = String(token.role ?? ""); }
      return session;
    },
  },
});
