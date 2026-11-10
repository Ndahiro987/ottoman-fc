"use strict";

import { NextRequest, NextResponse } from "next/server";
import { requirePermission, auditLog } from "@/lib/auth";
import { requireDatabase, transaction } from "@/lib/db";
import { z } from "zod";

const matchScoreSchema = z.object({
  home_score: z.coerce.number().int().nonnegative().optional(),
  away_score: z.coerce.number().int().nonnegative().optional(),
  status: z.enum(["scheduled", "postponed", "cancelled", "completed"]).optional(),
  coach_comments: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requirePermission("matches.manage");
    await requireDatabase();
    const body = await request.json();
    const data = matchScoreSchema.parse(body);
    const { id } = await params;

    return await transaction(async (client) => {
      const match = (await client.query("SELECT id, opponent, match_date, status, home_score, away_score FROM matches WHERE id = $1", [id])).rows[0];
      if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

      const updates: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (data.home_score !== undefined) {
        updates.push(`home_score = $${paramIndex++}`);
        values.push(data.home_score);
      }
      if (data.away_score !== undefined) {
        updates.push(`away_score = $${paramIndex++}`);
        values.push(data.away_score);
      }
      if (data.status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(data.status);
      }
      if (data.coach_comments !== undefined) {
        updates.push(`coach_comments = $${paramIndex++}`);
        values.push(data.coach_comments);
      }

      if (updates.length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 });
      }

      updates.push(`updated_at = now()`);
      values.push(id);

      const query = `UPDATE matches SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING id, opponent, match_date, home_score, away_score, status, coach_comments`;
      const result = await client.query(query, values);

      await auditLog({
        userId: me.id, action: "MATCH_UPDATED", entityType: "match", entityId: id,
        oldValues: { home_score: match.home_score, away_score: match.away_score, status: match.status },
        newValues: { home_score: data.home_score, away_score: data.away_score, status: data.status },
      });

      return NextResponse.json({ ok: true, match: result.rows[0] });
    });
  } catch (e: unknown) {
    const err = e as Error & { status?: number; code?: string; name?: string; errors?: unknown };
    if (err.status === 401 || err.status === 403) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err.code === "DB_UNAVAILABLE") return NextResponse.json({ error: err.message }, { status: 503 });
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: err.message || "Failed to update match" }, { status: 500 });
  }
}
