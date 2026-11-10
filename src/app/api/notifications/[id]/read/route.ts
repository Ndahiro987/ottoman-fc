"use strict";

import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { z } from "zod";

const markReadSchema = z.object({
  is_read: z.boolean().default(true),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requireDatabase();

    const { id } = await params;
    const body = await request.json();
    const { is_read } = markReadSchema.parse(body);

    await db.query("UPDATE notifications SET is_read = $1 WHERE id = $2 AND user_id = $3", [is_read, id, me.id]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.status === 401 || e.status === 403) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    if (e.name === "ZodError") return NextResponse.json({ error: e.errors }, { status: 400 });
    return NextResponse.json({ error: e.message || "Failed to update notification" }, { status: 500 });
  }
}
