"use strict";

import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getSessionUser, auditLog } from "@/lib/auth";
import { db, requireDatabase, transaction } from "@/lib/db";
import { z } from "zod";

const trainingSessionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  session_type: z.string().optional(),
  session_date: z.string().min(1, "Session date is required"),
  venue: z.string().optional(),
  responsible_coach: z.string().optional(),
  description: z.string().optional(),
  squad_ids: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requirePermission("training.view");
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requireDatabase();

    let query = `SELECT id, title, session_type, session_date, venue, responsible_coach,
      description, squad_ids, created_at, updated_at
      FROM training_sessions WHERE 1=1 ORDER BY session_date DESC`;
    const result = await db.query(query);
    return NextResponse.json({ training_sessions: result.rows });
  } catch (e: any) {
    if (e.status === 401 || e.status === 403) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    return NextResponse.json({ error: e.message || "Failed to load training sessions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const me = await requirePermission("training.create");
    await requireDatabase();
    const body = await request.json();
    const data = trainingSessionSchema.parse(body);

    return await transaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO training_sessions (title, session_type, session_date, venue, responsible_coach,
          description, squad_ids)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING id, title, session_type, session_date, venue, responsible_coach,
          description, squad_ids`,
        [data.title, data.session_type || null, data.session_date, data.venue || null,
          data.responsible_coach || null, data.description || null,
          data.squad_ids || null]
      );

      await auditLog({
        userId: me.id, action: "TRAINING_SESSION_CREATED", entityType: "training_session", entityId: insert.rows[0].id,
        newValues: { title: data.title, session_date: data.session_date },
      });

      return NextResponse.json({ ok: true, training_session: insert.rows[0] }, { status: 201 });
    });
  } catch (e: any) {
    if (e.status === 401 || e.status === 403) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    if (e.name === "ZodError") return NextResponse.json({ error: e.errors }, { status: 400 });
    return NextResponse.json({ error: e.message || "Failed to create training session" }, { status: 500 });
  }
}
