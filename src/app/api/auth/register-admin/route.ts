"use strict";

import { NextRequest, NextResponse } from "next/server";
import { requireDatabase, db } from "@/lib/db";
import { hashPassword, getUserPermissions } from "@/lib/auth";
import { z } from "zod";

const registerAdminSchema = z.object({
  email: z.string().email("Valid email is required"),
  username: z.string().min(2, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
});

export async function POST(request: NextRequest) {
  try {
    await requireDatabase();

    // One-time guard: only allow when no users exist yet
    const existing = await db.query("SELECT id FROM users LIMIT 1");
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { ok: false, error: "An administrator account already exists." },
        { status: 409 }
      );
    }

    const body = await request.json();
    const data = registerAdminSchema.parse(body);

    const passwordHash = await hashPassword(data.password);

    const result = await db.query(
      `INSERT INTO users (email, username, password_hash, first_name, last_name, role, is_active, email_verified)
       VALUES ($1,$2,$3,$4,$5,'administrator',true,true)
       RETURNING id, email, username, first_name, last_name, role`,
      [data.email, data.username, passwordHash, data.first_name, data.last_name]
    );

    const user = result.rows[0];

    // Assign administrator role
    const adminRole = (await db.query("SELECT id FROM roles WHERE name = $1", ["administrator"])).rows[0];
    if (adminRole) {
      await db.query(
        `INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1,$2,$3) ON CONFLICT (user_id, role_id) DO NOTHING`,
        [user.id, adminRole.id, user.id]
      );
      // Grant all permissions to administrator
      const allPerms = await db.query("SELECT id FROM permissions");
      for (const p of allPerms.rows) {
        await db.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1,$2) ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [adminRole.id, p.id]
        );
      }
    }

    const permissions = await getUserPermissions(user.id);

    return NextResponse.json({
      ok: true,
      message: "Administrator account created successfully.",
      user: { id: user.id, email: user.email, username: user.username, role: user.role, permissions },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    if (e instanceof Error && e.message === "DB_UNAVAILABLE") return NextResponse.json({ error: message }, { status: 503 });
    if (e instanceof Error && e.name === "ZodError") return NextResponse.json({ error: (e as unknown as { errors: unknown }).errors }, { status: 400 });
    return NextResponse.json({ ok: false, error: message || "Failed to create administrator account" }, { status: 500 });
  }
}
