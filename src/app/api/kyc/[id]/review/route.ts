"use strict";

import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getSessionUser, auditLog } from "@/lib/auth";
import { db, requireDatabase, transaction } from "@/lib/db";
import { z } from "zod";

const reviewSchema = z.object({
  verification_status: z.enum(["approved", "rejected", "requires_resubmission"]),
  rejection_reason: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requirePermission("kyc.review");
    await requireDatabase();
    const body = await request.json();
    const { verification_status, rejection_reason } = reviewSchema.parse(body);
    const { id } = await params;

    return await transaction(async (client) => {
      const doc = (await client.query("SELECT id, player_id, verification_status FROM player_documents WHERE id = $1", [id])).rows[0];
      if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

      await client.query(
        `UPDATE player_documents SET verification_status = $1, reviewing_administrator = $2, review_date = now(), rejection_reason = $3 WHERE id = $4`,
        [verification_status, me.id, verification_status === "rejected" ? rejection_reason || null : null, id]
      );

      // If document rejected, set player kyc_status accordingly
      if (verification_status === "rejected") {
        await client.query("UPDATE players SET kyc_status = 'rejected' WHERE id = $1", [doc.player_id]);
      } else if (verification_status === "approved") {
        await client.query("UPDATE players SET kyc_status = 'approved' WHERE id = $1", [doc.player_id]);
      }

      await auditLog({
        userId: me.id, action: "KYC_REVIEW", entityType: "player_document", entityId: id,
        oldValues: { verification_status: doc.verification_status },
        newValues: { verification_status, rejection_reason },
      });

      return NextResponse.json({ ok: true, verification_status });
    });
  } catch (e: any) {
    if (e.status === 401 || e.status === 403) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    if (e.name === "ZodError") return NextResponse.json({ error: e.errors }, { status: 400 });
    return NextResponse.json({ error: e.message || "Failed to review document" }, { status: 500 });
  }
}
