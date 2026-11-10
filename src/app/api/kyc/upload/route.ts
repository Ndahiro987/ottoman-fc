"use strict";

import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getSessionUser, auditLog } from "@/lib/auth";
import { db, requireDatabase, transaction } from "@/lib/db";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export async function POST(request: NextRequest) {
  try {
    const me = await requirePermission("kyc.view");
    await requireDatabase();

    const formData = await request.formData();
    const playerId = formData.get("player_id") as string;
    const documentType = formData.get("document_type") as string;
    const fileReference = formData.get("document_reference") as string;
    const expiryDate = formData.get("expiry_date") as string;
    const file = formData.get("file") as File | null;

    if (!playerId || !documentType || !file) {
      return NextResponse.json({ error: "player_id, document_type and file are required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(UPLOAD_DIR, safeName);
    fs.writeFileSync(filePath, buffer);

    return await transaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO player_documents (player_id, document_type, document_reference, file_url, file_name, file_size, mime_type, upload_date, expiry_date, verification_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,now(),$8,'not_submitted')
         RETURNING id`,
        [playerId, documentType, fileReference || null, `/api/kyc/document/${safeName}`, file.name, buffer.length, file.type || "application/octet-stream", expiryDate || null]
      );

      await auditLog({
        userId: me.id, action: "KYC_UPLOAD", entityType: "player_document", entityId: insert.rows[0].id,
        newValues: { playerId, documentType, fileName: file.name },
      });

      return NextResponse.json({ ok: true, documentId: insert.rows[0].id }, { status: 201 });
    });
  } catch (e: any) {
    if (e.status === 401 || e.status === 403) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e.code === "DB_UNAVAILABLE") return NextResponse.json({ error: e.message }, { status: 503 });
    return NextResponse.json({ error: e.message || "Failed to upload document" }, { status: 500 });
  }
}
