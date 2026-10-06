import { clerkMiddleware, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminPath, isPublicPath, getAccess } from "./lib/access";

export default clerkMiddleware(async (auth, request) => {
  const path = request.nextUrl.pathname;
  // This exact endpoint authenticates a scheduler bearer secret, never a browser session.
  if (path === '/api/cron/wfd-notifications') return;
  if (isPublicPath(path) || path.startsWith('/__clerk/')) return;
  const { userId } = await auth();
  const api = path.startsWith('/api/');
  if (!userId) return api
    ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    : NextResponse.redirect(new URL('/sign-in', request.url));
  // This exact endpoint performs fresh authorization in requireAccess().
  // Keep session validation above, but avoid a duplicate Clerk Backend request.
  if (path === '/api/firebase-token') {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }
  try {
    const user = await (await clerkClient()).users.getUser(userId);
    const access = getAccess(user.privateMetadata);
    if (path === '/pending-approval') {
      const response = access.approved
        ? NextResponse.redirect(new URL(access.staff ? '/admin/students' : '/shadow', request.url))
        : NextResponse.next();
      response.headers.set('Cache-Control', 'private, no-store');
      return response;
    }
    if (path === '/api/access') return;
    if (!access.approved) return api
      ? NextResponse.json({ error: 'Approval required' }, { status: 403 })
      : NextResponse.redirect(new URL('/pending-approval', request.url));
    if (isAdminPath(path) && !access.staff) return api
      ? NextResponse.json({ error: 'Admin required' }, { status: 403 })
      : NextResponse.redirect(new URL('/shadow', request.url));
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch {
    return new NextResponse('Authentication service unavailable. Please retry.', { status: 503 });
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
    "/shadowingsource/:path*",
  ],
};
