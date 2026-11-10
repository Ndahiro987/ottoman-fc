import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verify, type JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const PUBLIC_PATHS = ["/login", "/api/", "/_next/", "/favicon.ico", "/setup"];

const ADMIN_PATHS = ["/admin"];
const COACH_PATHS = ["/coach"];
const PLAYER_PATHS = ["/player"];

interface TokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("ottomanfc_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let role: string | null = null;
  try {
    const payload = verify(token, JWT_SECRET as unknown as string) as unknown as TokenPayload;
    role = payload.role;
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "invalid_session");
    return NextResponse.redirect(loginUrl);
  }

  if (ADMIN_PATHS.some((p) => pathname.startsWith(p)) && role !== "administrator") {
    return NextResponse.redirect(new URL("/login?error=access_denied", request.url));
  }
  if (COACH_PATHS.some((p) => pathname.startsWith(p)) && role !== "coach") {
    return NextResponse.redirect(new URL("/login?error=access_denied", request.url));
  }
  if (PLAYER_PATHS.some((p) => pathname.startsWith(p)) && role !== "player") {
    return NextResponse.redirect(new URL("/login?error=access_denied", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/coach/:path*", "/player/:path*", "/login"],
};
