"use strict";

import { NextRequest, NextResponse } from "next/server";
import { requireRole, auditLog } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { requireDatabase, transaction } from "@/lib/db";
import { z } from "zod";

const approveSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireRole(["administrator"]);
    await requireDatabase();
    const body = await request.json();
    const { status, reason } = approveSchema.parse(body);
    const { id } = await params;

    return await transaction(async (client) => {
      const player = (await client.query("SELECT id, player_id, full_name, status, user_id FROM players WHERE id = $1", [id])).rows[0];
      if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

      const newStatus = status === "approved" ? "active" : "rejected";

      await client.query("UPDATE players SET status = $1 WHERE id = $2", [newStatus, id]);

      await client.query(
        `INSERT INTO player_approvals (player_id, status, reviewed_by, reason) VALUES ($1,$2,$3,$4)`,
        [id, newStatus, me.id, reason || (status === "approved" ? "Registration approved" : "Registration rejected")]
      );

      if (newStatus === "active" && player.user_id) {
        await client.query("UPDATE users SET is_active = true WHERE id = $1", [player.user_id]);
      }

      await auditLog({
        userId: me.id, action: "PLAYER_REGISTRATION_" + status.toUpperCase(), entityType: "player", entityId: id,
        oldValues: { status: player.status }, newValues: { status: newStatus, reason },
      });

      // Send notification email to player (non-blocking)
      if (player.user_id) {
        const userRow = await client.query("SELECT email FROM users WHERE id = $1", [player.user_id]);
        if (userRow.rows.length > 0) {
          void sendVerificationEmail({
            to: userRow.rows[0].email,
            playerName: player.full_name,
            playerId: player.player_id,
            status: newStatus === "active" ? "approved" : "rejected",
          }).catch(() => {
            // Email failures should not block approval
          });
        }
      }

      return NextResponse.json({ ok: true, status: newStatus });
    });
  } catch (e: unknown) {
    const err = e as Error & { status?: number; code?: string; name?: string; errors?: unknown };
    if (err.status === 401) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err.status === 403) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (err.code === "DB_UNAVAILABLE") return NextResponse.json({ error: err.message }, { status: 503 });
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: err.message || "Failed to process registration" }, { status: 500 });
  }
}
