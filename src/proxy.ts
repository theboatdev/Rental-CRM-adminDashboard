import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isSuperAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

const isSignInRoute = createRouteMatcher(["/sign-in(.*)"]);
const isUnauthorizedRoute = createRouteMatcher(["/unauthorized"]);

/**
 * Optimistic gate: everything except sign-in needs a session, and everything
 * except /unauthorized needs the super_admin platform role. Data access and
 * Server Actions re-check through src/lib/dal.ts.
 */
export default clerkMiddleware(async (auth, req) => {
  if (isSignInRoute(req)) return;

  const { userId, sessionClaims, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn({ returnBackUrl: req.url });

  if (!isUnauthorizedRoute(req) && !isSuperAdmin(sessionClaims)) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files (including /monaco assets) unless found in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
