"use strict";

import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getSessionUser, auditLog } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { z } from "zod";

const notificationSchema = z.object({
  user_id: z.string(),
  title: z.string().min(1, "Title is required"),
  message: z.string().optional(),
  type: z.string().default("info"),
  link: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requirePermission("notifications.view");
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requireDatabase();

    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id") || undefined;
    const unread_only = searchParams.get("unread_only") === "true";

    let query = `SELECT id, user_id, title, message, type, is_read, created_at, link FROM notifications WHERE 1=1`;
    const params: unknown[] = [];
    if (user_id) {
      query += ` AND user_id = $${params.length + 1}`;
      params.push(user_id);
    }
    if (unread_only) {
      query += ` AND is_read = false`;
    }
    query += ` ORDER BY created_at DESC LIMIT 100`;
    const result = await db.query(query, params);
    return NextResponse.json({ notifications: result.rows });
  } catch (e: any) {
    if (e.status === 401 || e.status === 403) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    return NextResponse.json({ error: e.message || "Failed to load notifications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const me = await requirePermission("notifications.create");
    await requireDatabase();
    const body = await request.json();
    const data = notificationSchema.parse(body);

    const insert = await db.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, user_id, title, message, type, is_read, created_at, link`,
      [data.user_id, data.title, data.message || null, data.type, data.link || null]
    );

    await auditLog({
      userId: me.id, action: "NOTIFICATION_CREATED", entityType: "notification", entityId: insert.rows[0].id,
      newValues: { title: data.title, type: data.type, user_id: data.user_id },
    });

    return NextResponse.json({ ok: true, notification: insert.rows[0] }, { status: 201 });
  } catch (e: any) {
    if (e.status === 401 || e.status === 403) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    if (e.name === "ZodError") return NextResponse.json({ error: e.errors }, { status: 400 });
    return NextResponse.json({ error: e.message || "Failed to create notification" }, { status: 500 });
  }
}
