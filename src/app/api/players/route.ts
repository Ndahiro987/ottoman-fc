"use strict";

import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { requirePermission, requireRole, getSessionUser, auditLog, type AuthUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { z } from "zod";

const registerSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  national_id: z.string().optional(),
  passport_number: z.string().optional(),
  phone: z.string().optional(),
  alternative_phone: z.string().optional(),
  email: z.string().email().optional().nullable(),
  residential_address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_number: z.string().optional(),
  primary_position: z.string().optional(),
  secondary_position: z.string().optional(),
  preferred_foot: z.string().optional(),
  jersey_number: z.coerce.number().optional().nullable(),
  previous_club: z.string().optional(),
  football_experience: z.string().optional(),
  player_category: z.string().optional(),
  registration_date: z.string().optional(),
});

async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function GET(request: NextRequest) {
  try {
    await requirePermission("players.view");
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requireDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "25", 10), 1), 100);
    const offset = (page - 1) * limit;

    let countQuery = `SELECT count(*) FROM players p WHERE 1=1`;
    const countParams: unknown[] = [];
    if (search) {
      countQuery += ` AND (p.full_name ILIKE $${countParams.length + 1} OR p.player_id ILIKE $${countParams.length + 2})`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      countQuery += ` AND p.status = $${countParams.length + 1}`;
      countParams.push(status);
    }
    if (category) {
      countQuery += ` AND p.player_category = $${countParams.length + 1}`;
      countParams.push(category);
    }
    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count as string, 10);

    let query = `
      SELECT p.id, p.player_id, p.full_name, p.date_of_birth, p.gender, p.nationality,
             p.phone, p.email, p.primary_position, p.secondary_position, p.preferred_foot,
             p.jersey_number, p.previous_club, p.player_category, p.registration_date,
             p.status, p.kyc_status, p.created_at
      FROM players p
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (search) {
      query += ` AND (p.full_name ILIKE $${params.length + 1} OR p.player_id ILIKE $${params.length + 2})`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      query += ` AND p.status = $${params.length + 1}`;
      params.push(status);
    }
    if (category) {
      query += ` AND p.player_category = $${params.length + 1}`;
      params.push(category);
    }
    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    let rows = result.rows;
    if (me.role === "player") {
      rows = rows.filter((r) => r.user_id === me.id);
    }

    return NextResponse.json({
      players: rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (e.status === 403) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    return NextResponse.json({ error: e.message || "Failed to load players" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const me = await requireRole(["administrator"]);
    await requireDatabase();
    const body = await request.json();
    const data = registerSchema.parse(body);

    const year = new Date().toLocaleString("en-US", { timeZone: "Africa/Kampala" }).split("/")[2]?.slice(0, 4) || String(new Date().getFullYear());
    const last = (await db.query("SELECT player_id FROM players WHERE player_id LIKE $1 ORDER BY player_id DESC LIMIT 1", [`OTF-${year}-%`])).rows[0];
    const nextNum = last ? Number((last.player_id as string).split("-").pop()) + 1 : 1;
    const player_id = `OTF-${year}-${String(nextNum).padStart(4, "0")}`;

    return await transaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO players (player_id, full_name, date_of_birth, gender, nationality, national_id,
           passport_number, phone, alternative_phone, email, residential_address,
           emergency_contact_name, emergency_contact_number, primary_position, secondary_position,
           preferred_foot, jersey_number, previous_club, football_experience, player_category,
           registration_date, status, kyc_status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,'pending','not_submitted',$23)
         RETURNING id, player_id, full_name, status, kyc_status`,
        [
          player_id, data.full_name, data.date_of_birth || null, data.gender || null, data.nationality || null,
          data.national_id || null, data.passport_number || null, data.phone || null,
          data.alternative_phone || null, data.email || null, data.residential_address || null,
          data.emergency_contact_name || null, data.emergency_contact_number || null,
          data.primary_position || null, data.secondary_position || null, data.preferred_foot || null,
          data.jersey_number || null, data.previous_club || null, data.football_experience || null,
          data.player_category || null, data.registration_date || null, me.id,
        ]
      );

      await client.query(
        `INSERT INTO player_approvals (player_id, status, reviewed_by, reason) VALUES ($1,'pending',$2,'Registration submitted')`,
        [insert.rows[0].id, me.id]
      );

      await auditLog({
        userId: me.id, action: "PLAYER_REGISTERED", entityType: "player", entityId: insert.rows[0].id,
        newValues: { player_id, full_name: data.full_name },
      });

      return NextResponse.json({ ok: true, player: insert.rows[0] }, { status: 201 });
    });
  } catch (e: any) {
    if (e.status === 401) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (e.status === 403) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    if (e.name === "ZodError") return NextResponse.json({ error: e.errors }, { status: 400 });
    return NextResponse.json({ error: e.message || "Failed to register player" }, { status: 500 });
  }
}
