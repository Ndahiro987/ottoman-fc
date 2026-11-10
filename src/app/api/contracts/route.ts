"use strict";

import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getSessionUser, auditLog } from "@/lib/auth";
import { db, requireDatabase, transaction } from "@/lib/db";
import { z } from "zod";

const contractSchema = z.object({
  player_id: z.string(),
  contract_type: z.string(),
  commencement_date: z.string(),
  expiry_date: z.string(),
  agreed_remuneration: z.coerce.number().optional().nullable(),
  currency: z.string().default("UGX"),
  payment_frequency: z.string().optional(),
  contract_conditions: z.string().optional(),
  additional_clauses: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requirePermission("contracts.view");
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requireDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    let query = `SELECT c.id, c.contract_id, c.player_id, p.full_name AS player_name, c.contract_type,
      c.commencement_date, c.expiry_date, c.agreed_remuneration, c.currency, c.payment_frequency,
      c.status, c.created_at
      FROM contracts c JOIN players p ON p.id = c.player_id WHERE 1=1`;
    const params: unknown[] = [];
    if (status) {
      query += ` AND c.status = $${params.length + 1}`;
      params.push(status);
    }
    query += ` ORDER BY c.created_at DESC`;
    const result = await db.query(query, params);
    return NextResponse.json({ contracts: result.rows });
  } catch (e: any) {
    if (e.status === 401 || e.status === 403) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    return NextResponse.json({ error: e.message || "Failed to load contracts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const me = await requirePermission("contracts.create");
    await requireDatabase();
    const body = await request.json();
    const data = contractSchema.parse(body);

    const year = new Date().toLocaleString("en-US", { timeZone: "Africa/Kampala" }).split("/")[2]?.slice(0, 4) || String(new Date().getFullYear());
    const last = (await db.query("SELECT contract_id FROM contracts WHERE contract_id LIKE $1 ORDER BY contract_id DESC LIMIT 1", [`OTFC-${year}-%`])).rows[0];
    const nextNum = last ? Number((last.contract_id as string).split("-").pop()) + 1 : 1;
    const contract_id = `OTFC-${year}-${String(nextNum).padStart(4, "0")}`;

    return await transaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO contracts (contract_id, player_id, contract_type, commencement_date, expiry_date,
           agreed_remuneration, currency, payment_frequency, contract_conditions, additional_clauses,
           status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft',$11)
         RETURNING id, contract_id, status`,
        [contract_id, data.player_id, data.contract_type, data.commencement_date, data.expiry_date,
         data.agreed_remuneration || null, data.currency, data.payment_frequency || null,
         data.contract_conditions || null, data.additional_clauses || null, me.id]
      );

      await auditLog({
        userId: me.id, action: "CONTRACT_CREATED", entityType: "contract", entityId: insert.rows[0].id,
        newValues: { contract_id, player_id: data.player_id },
      });

      return NextResponse.json({ ok: true, contract: insert.rows[0] }, { status: 201 });
    });
  } catch (e: any) {
    if (e.status === 401 || e.status === 403) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    if (e.name === "ZodError") return NextResponse.json({ error: e.errors }, { status: 400 });
    return NextResponse.json({ error: e.message || "Failed to create contract" }, { status: 500 });
  }
}
