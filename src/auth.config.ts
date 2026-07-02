import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

const publicPaths = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/error",
];

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    // Stub for edge — real authorize logic lives in auth.ts
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async () => null,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isAuthenticated = !!auth?.user;
      const { pathname } = nextUrl;

      if (pathname.startsWith("/api/auth")) return true;

      const isPublicPath = publicPaths.some(
        (p) => pathname === p || pathname.startsWith(p + "?")
      );

      if (!isAuthenticated && !isPublicPath) {
        return Response.redirect(new URL("/auth/signin", nextUrl));
      }
      if (isAuthenticated && pathname.startsWith("/auth")) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
  session: { strategy: "jwt" },
};
