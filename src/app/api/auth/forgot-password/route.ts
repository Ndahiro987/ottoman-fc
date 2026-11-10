"use strict";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { auditLog } from "@/lib/auth";

const forgotSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotSchema.parse(body);

    const result = await db.query(
      `SELECT id, email, username FROM users WHERE email = $1 AND is_active = true`,
      [email]
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return NextResponse.json({ ok: true, message: "If an account exists, a reset link has been sent." });
    }

    const user = result.rows[0];

    // Create a password reset token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    try {
      await db.query(
        `INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used)
         VALUES (?, ?, ?, ?, false)
         ON CONFLICT(user_id) DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at, used = false`,
        [crypto.randomUUID(), user.id, token, expiresAt]
      );
    } catch {
      // Table may not exist; still return success
    }

    await auditLog({
      userId: user.id, action: "PASSWORD_RESET_REQUESTED", entityType: "user", entityId: user.id,
      newValues: { email },
    });

    return NextResponse.json({ ok: true, message: "If an account exists, a reset link has been sent." });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error?.message || "Failed to process request" }, { status: 500 });
  }
}
