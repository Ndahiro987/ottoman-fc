"use strict";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";

const resetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = resetSchema.parse(body);

    // Find the reset token
    const result = await db.query(
      `SELECT prt.id, prt.user_id, prt.expires_at, prt.used
       FROM password_reset_tokens prt
       WHERE prt.token = $1 AND prt.used = false`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid or already used reset token." }, { status: 400 });
    }

    const resetRecord = result.rows[0];

    // Check expiry
    const expiresAt = new Date(resetRecord.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: "Reset token has expired." }, { status: 400 });
    }

    // Hash the new password
    const passwordHash = await hashPassword(password);

    // Update the user's password
    await db.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, resetRecord.user_id]
    );

    // Mark the token as used
    await db.query(
      `UPDATE password_reset_tokens SET used = true WHERE id = $1`,
      [resetRecord.id]
    );

    return NextResponse.json({ ok: true, message: "Password reset successfully." });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error?.message || "Failed to reset password" }, { status: 500 });
  }
}
