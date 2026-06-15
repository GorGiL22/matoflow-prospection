import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith("/connexion") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/campaigns/track/open")
  );
}

export async function proxy(request: NextRequest) {
  if (process.env.AUTH_DISABLED === "true") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/connexion", request.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      pathname + request.nextUrl.search
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!connexion|api/auth|api/campaigns/track/open|_next/static|_next/image|favicon.ico).*)",
  ],
};
