"use strict";

import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("audit.view");
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requireDatabase();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || undefined;
    const entity_type = searchParams.get("entity_type") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

    let query = `SELECT al.id, al.action, al.entity_type, al.entity_id, al.old_values, al.new_values, al.ip_address, al.created_at, u.full_name AS user_name
      FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id WHERE 1=1`;
    const params: unknown[] = [];
    if (action) {
      query += ` AND al.action = $${params.length + 1}`;
      params.push(action);
    }
    if (entity_type) {
      query += ` AND al.entity_type = $${params.length + 1}`;
      params.push(entity_type);
    }
    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await db.query(query, params);
    return NextResponse.json({ audit_logs: result.rows });
  } catch (e: any) {
    if (e.status === 401 || e.status === 403) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    return NextResponse.json({ error: e.message || "Failed to load audit logs" }, { status: 500 });
  }
}
