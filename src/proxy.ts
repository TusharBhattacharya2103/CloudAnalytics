import { auth } from "@/auth";

export const proxy = auth;

export const config = {
  matcher: [
    /*
     * Run Auth.js only for application routes.
     * Exclude Next.js internals and common static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
