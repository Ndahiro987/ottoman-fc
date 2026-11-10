"use strict";

import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getSessionUser, auditLog } from "@/lib/auth";
import { db, requireDatabase, transaction } from "@/lib/db";
import { z } from "zod";

const approveSchema = z.object({
  status: z.enum(["active", "terminated"]),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requirePermission("contracts.approve");
    await requireDatabase();
    const body = await request.json();
    const { status, reason } = approveSchema.parse(body);
    const { id } = await params;

    return await transaction(async (client) => {
      const contract = (await client.query("SELECT id, contract_id, player_id, status FROM contracts WHERE id = $1", [id])).rows[0];
      if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });

      await client.query("UPDATE contracts SET status = $1 WHERE id = $2", [status, id]);

      await client.query(
        `INSERT INTO contract_amendments (contract_id, amended_by, reason, created_at)
         VALUES ($1,$2,$3,now())`,
        [id, me.id, reason || `Contract ${status}`]
      );

      await auditLog({
        userId: me.id, action: "CONTRACT_" + status.toUpperCase(), entityType: "contract", entityId: id,
        oldValues: { status: contract.status }, newValues: { status, reason },
      });

      return NextResponse.json({ ok: true, status });
    });
  } catch (e: any) {
    if (e.status === 401 || e.status === 403) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    if (e.name === "ZodError") return NextResponse.json({ error: e.errors }, { status: 400 });
    return NextResponse.json({ error: e.message || "Failed to process contract" }, { status: 500 });
  }
}
