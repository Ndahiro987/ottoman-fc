"use strict";

import { NextResponse } from "next/server";
import { requireDatabase, db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ setupComplete: false }, { status: 401 });
    }
    if (user.role !== "administrator") {
      return NextResponse.json({ setupComplete: false }, { status: 403 });
    }

    await requireDatabase();
    const result = await db.query("SELECT id FROM users LIMIT 1");
    return NextResponse.json({ setupComplete: result.rows.length > 0 });
  } catch {
    return NextResponse.json({ setupComplete: false }, { status: 503 });
  }
}
