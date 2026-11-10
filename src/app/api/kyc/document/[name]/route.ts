"use strict";

import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import * as fs from "fs";
import * as path from "path";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    await requirePermission("kyc.view");
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requireDatabase();

    const { name } = await params;
    // Verify the document exists and belongs to a player the user may access
    const fileName = decodeURIComponent(name);
    const filePath = path.join(UPLOAD_DIR, fileName);

    const doc = (await db.query(
      `SELECT d.id, d.player_id, d.file_name, d.mime_type, d.file_size, p.user_id
       FROM player_documents d JOIN players p ON p.id = d.player_id
       WHERE d.file_url LIKE $1`,
      [`%${fileName}`]
    )).rows[0];

    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    // Access control: administrators and coaches may view; players only their own
    if (me.role === "player" && doc.user_id !== me.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!fs.existsSync(filePath)) return NextResponse.json({ error: "File not on disk" }, { status: 404 });

    const buffer = fs.readFileSync(filePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": doc.mime_type || "application/octet-stream",
        "Content-Disposition": `inline; filename="${doc.file_name}"`,
        "Content-Length": String(doc.file_size),
      },
    });
  } catch (e: any) {
    if (e.status === 401 || e.status === 403) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    return NextResponse.json({ error: e.message || "Failed to download document" }, { status: 500 });
  }
}
