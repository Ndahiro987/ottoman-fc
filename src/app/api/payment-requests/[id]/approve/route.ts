"use strict";

import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getSessionUser, auditLog } from "@/lib/auth";
import { db, requireDatabase, transaction } from "@/lib/db";
import { z } from "zod";

const paymentApprovalSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requirePermission("payments.approve");
    await requireDatabase();
    const body = await request.json();
    const { status, reason } = paymentApprovalSchema.parse(body);
    const { id } = await params;

    return await transaction(async (client) => {
      const req = (await client.query("SELECT id, request_number, approval_status FROM payment_requests WHERE id = $1", [id])).rows[0];
      if (!req) return NextResponse.json({ error: "Payment request not found" }, { status: 404 });

      await client.query("UPDATE payment_requests SET approval_status = $1, rejected_reason = $2 WHERE id = $3", [
        status, status === "rejected" ? reason || null : null, id,
      ]);

      await auditLog({
        userId: me.id, action: "PAYMENT_" + status.toUpperCase(), entityType: "payment_request", entityId: id,
        oldValues: { approval_status: req.approval_status },
        newValues: { status, reason },
      });

      return NextResponse.json({ ok: true, status });
    });
  } catch (e: any) {
    if (e.status === 401 || e.status === 403) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    if (e.name === "ZodError") return NextResponse.json({ error: e.errors }, { status: 400 });
    return NextResponse.json({ error: e.message || "Failed to process payment" }, { status: 500 });
  }
}
