"use strict";

import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getSessionUser, auditLog } from "@/lib/auth";
import { db, requireDatabase, transaction } from "@/lib/db";
import { z } from "zod";

const matchSchema = z.object({
  opponent: z.string().min(1, "Opponent is required"),
  competition: z.string().optional(),
  match_date: z.string().min(1, "Match date is required"),
  venue: z.string().optional(),
  home_or_away: z.enum(["home", "away", "neutral"]).default("home"),
  home_score: z.coerce.number().int().nonnegative().optional(),
  away_score: z.coerce.number().int().nonnegative().optional(),
  status: z.enum(["scheduled", "postponed", "cancelled", "completed"]).default("scheduled"),
  coach_comments: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requirePermission("matches.view");
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requireDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    let query = `SELECT id, opponent, competition, match_date, venue, home_or_away,
      home_score, away_score, status, coach_comments, created_at, updated_at
      FROM matches WHERE 1=1`;
    const params: unknown[] = [];
    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    query += ` ORDER BY match_date DESC`;
    const result = await db.query(query, params);
    return NextResponse.json({ matches: result.rows });
  } catch (e: any) {
    if (e.status === 401 || e.status === 403) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    return NextResponse.json({ error: e.message || "Failed to load matches" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const me = await requirePermission("matches.create");
    await requireDatabase();
    const body = await request.json();
    const data = matchSchema.parse(body);

    return await transaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO matches (opponent, competition, match_date, venue, home_or_away,
          home_score, away_score, status, coach_comments)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING id, opponent, competition, match_date, venue, home_or_away,
          home_score, away_score, status, coach_comments`,
        [data.opponent, data.competition || null, data.match_date, data.venue || null,
          data.home_or_away, data.home_score || null, data.away_score || null,
          data.status, data.coach_comments || null]
      );

      await auditLog({
        userId: me.id, action: "MATCH_CREATED", entityType: "match", entityId: insert.rows[0].id,
        newValues: { opponent: data.opponent, match_date: data.match_date, status: data.status },
      });

      return NextResponse.json({ ok: true, match: insert.rows[0] }, { status: 201 });
    });
  } catch (e: any) {
    if (e.status === 401 || e.status === 403) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    if (e.name === "ZodError") return NextResponse.json({ error: e.errors }, { status: 400 });
    return NextResponse.json({ error: e.message || "Failed to create match" }, { status: 500 });
  }
}
