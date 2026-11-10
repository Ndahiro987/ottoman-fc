"use strict";

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, generateToken, setAuthCookie, auditLog } from "@/lib/auth";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5;

const loginRateLimit = new Map<string, RateLimitEntry>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = loginRateLimit.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    loginRateLimit.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - entry.count };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json({ error: "Email/username and password are required." }, { status: 400 });
    }

    const clientIp = getClientIp(request);
    const rateKey = `${clientIp}:${identifier}`;
    const rate = checkRateLimit(rateKey);

    if (!rate.allowed) {
      await auditLog({ action: "LOGIN_RATE_LIMITED", entityType: "user", newValues: { identifier } });
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        { status: 429 }
      );
    }

    const user = await authenticateUser(identifier, password);

    if (!user) {
      await auditLog({ action: "LOGIN_FAILED", entityType: "user", newValues: { identifier } });
      return NextResponse.json({ error: "Invalid email/username or password." }, { status: 401 });
    }

    // If the user is a player, check that their registration has been approved
    if (user.role === "player") {
      const { db } = await import("@/lib/db");
      const playerResult = await db.query(
        `SELECT p.status, p.kyc_status FROM players p WHERE p.user_id = $1`,
        [user.id]
      );
      if (playerResult.rows.length > 0) {
        const { status } = playerResult.rows[0];
        if (status !== "active") {
          await auditLog({ userId: user.id, action: "LOGIN_BLOCKED_NOT_APPROVED", entityType: "user", entityId: user.id });
          const msg = status === "rejected"
            ? "Your registration has been rejected. Contact the club administrator."
            : "Your registration is pending administrator approval. You cannot sign in yet.";
          return NextResponse.json({ error: msg, status_code: "not_approved" }, { status: 403 });
        }
      }
    }

    // Reset rate limit on successful login
    loginRateLimit.delete(rateKey);

    const token = generateToken(user);
    await setAuthCookie(token);

    await auditLog({ userId: user.id, action: "LOGIN", entityType: "user", entityId: user.id });

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, username: user.username, role: user.role, permissions: user.permissions },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Login failed." }, { status: 500 });
  }
}
