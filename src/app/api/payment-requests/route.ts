"use strict";

import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getSessionUser, auditLog } from "@/lib/auth";
import { db, requireDatabase, transaction } from "@/lib/db";
import { z } from "zod";

const paymentRequestSchema = z.object({
  player_id: z.string(),
  payment_category: z.string(),
  amount: z.coerce.number().positive(),
  currency: z.string().default("UGX"),
  payment_description: z.string().optional(),
  requested_date: z.string().optional(),
  supporting_evidence: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requirePermission("payments.view");
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requireDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    let query = `SELECT pr.id, pr.request_number, pr.player_id, p.full_name AS player_name, pr.payment_category,
      pr.amount, pr.currency, pr.payment_description, pr.requested_date, pr.approval_status,
      pr.rejection_reason, pr.created_at
      FROM payment_requests pr JOIN players p ON p.id = pr.player_id WHERE 1=1`;
    const params: unknown[] = [];
    if (status) {
      query += ` AND pr.approval_status = $${params.length + 1}`;
      params.push(status);
    }
    query += ` ORDER BY pr.requested_date DESC`;
    const result = await db.query(query, params);
    return NextResponse.json({ requests: result.rows });
  } catch (e: any) {
    if (e.status === 401 || e.status === 403) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    return NextResponse.json({ error: e.message || "Failed to load payment requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const me = await requirePermission("payments.create");
    await requireDatabase();
    const body = await request.json();
    const data = paymentRequestSchema.parse(body);

    const year = new Date().toLocaleString("en-US", { timeZone: "Africa/Kampala" }).split("/")[2]?.slice(0, 4) || String(new Date().getFullYear());
    const last = (await db.query("SELECT request_number FROM payment_requests WHERE request_number LIKE $1 ORDER BY request_number DESC LIMIT 1", [`REQ-${year}-%`])).rows[0];
    const nextNum = last ? Number((last.request_number as string).split("-").pop()) + 1 : 1;
    const request_number = `REQ-${year}-${String(nextNum).padStart(5, "0")}`;

    return await transaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO payment_requests (request_number, player_id, payment_category, amount, currency,
           payment_description, requested_date, requested_by, supporting_evidence, approval_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
         RETURNING id, request_number, approval_status`,
        [request_number, data.player_id, data.payment_category, data.amount, data.currency,
         data.payment_description || null, data.requested_date || null, me.id, data.supporting_evidence || null]
      );

      await auditLog({
        userId: me.id, action: "PAYMENT_REQUEST_CREATED", entityType: "payment_request", entityId: insert.rows[0].id,
        newValues: { request_number, amount: data.amount, category: data.payment_category },
      });

      return NextResponse.json({ ok: true, request: insert.rows[0] }, { status: 201 });
    });
  } catch (e: any) {
    if (e.status === 401 || e.status === 403) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    if (e.name === "ZodError") return NextResponse.json({ error: e.errors }, { status: 400 });
    return NextResponse.json({ error: e.message || "Failed to create payment request" }, { status: 500 });
  }
}
