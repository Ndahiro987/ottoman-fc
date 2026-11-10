"use strict";

import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("kyc.view");
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requireDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const playerId = searchParams.get("player_id") || undefined;

    let query = `
      SELECT d.id, d.player_id, p.full_name AS player_name, p.player_id AS player_code,
             d.document_type, d.document_reference, d.file_name, d.file_size, d.mime_type,
             d.upload_date, d.expiry_date, d.verification_status, d.reviewing_administrator,
             d.review_date, d.rejection_reason, d.created_at
      FROM player_documents d
      JOIN players p ON p.id = d.player_id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    if (status) {
      query += ` AND d.verification_status = $${params.length + 1}`;
      params.push(status);
    }
    if (playerId) {
      query += ` AND d.player_id = $${params.length + 1}`;
      params.push(playerId);
    }
    query += ` ORDER BY d.upload_date DESC`;

    const result = await db.query(query, params);
    return NextResponse.json({ documents: result.rows });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (e.status === 403) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    return NextResponse.json({ error: e.message || "Failed to load documents" }, { status: 500 });
  }
}
