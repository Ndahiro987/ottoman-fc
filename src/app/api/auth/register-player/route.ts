"use strict";

import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { db, requireDatabase, transaction } from "@/lib/db";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const registerSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(8, "Phone number is required"),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  national_id: z.string().min(1, "National ID is required"),
  passport_number: z.string().optional(),
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
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  try {
    await requireDatabase();

    const formData = await request.formData();

    const raw = {
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      date_of_birth: (formData.get("date_of_birth") as string) || undefined,
      gender: (formData.get("gender") as string) || undefined,
      nationality: (formData.get("nationality") as string) || undefined,
      national_id: formData.get("national_id") as string,
      passport_number: (formData.get("passport_number") as string) || undefined,
      residential_address: (formData.get("residential_address") as string) || undefined,
      emergency_contact_name: (formData.get("emergency_contact_name") as string) || undefined,
      emergency_contact_number: (formData.get("emergency_contact_number") as string) || undefined,
      primary_position: (formData.get("primary_position") as string) || undefined,
      secondary_position: (formData.get("secondary_position") as string) || undefined,
      preferred_foot: (formData.get("preferred_foot") as string) || undefined,
      jersey_number: (formData.get("jersey_number") as string) || undefined,
      previous_club: (formData.get("previous_club") as string) || undefined,
      football_experience: (formData.get("football_experience") as string) || undefined,
      player_category: (formData.get("player_category") as string) || undefined,
      registration_date: (formData.get("registration_date") as string) || undefined,
      password: formData.get("password") as string,
    };

    const data = registerSchema.parse(raw);

    // Check if email already exists
    const existing = await db.query("SELECT id FROM users WHERE email = $1", [data.email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const existingUsername = await db.query("SELECT id FROM users WHERE username = $1", [data.email.split("@")[0]]);
    if (existingUsername.rows.length > 0) {
      return NextResponse.json({ error: "Username already taken." }, { status: 409 });
    }

    return await transaction(async (client) => {
      // 1. Create user account (inactive until admin approves)
      const passwordHash = await hashPassword(data.password);
      const username = data.email.split("@")[0];

      const userResult = await client.query(
        `INSERT INTO users (email, username, password_hash, first_name, last_name, phone, role, is_active, email_verified)
         VALUES ($1,$2,$3,$4,$5,$6,'player',false,false)
         RETURNING id, email, username, role, is_active`,
        [data.email, username, passwordHash, data.full_name.split(" ")[0] || data.full_name,
         data.full_name.split(" ").slice(1).join(" ") || null, data.phone]
      );
      const userId = userResult.rows[0].id;

      // 2. Assign player role
      const playerRole = await client.query("SELECT id FROM roles WHERE name = $1", ["player"]);
      if (playerRole.rows.length > 0) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1,$2,$1) ON CONFLICT (user_id, role_id) DO NOTHING`,
          [userId, playerRole.rows[0].id]
        );
      }

      // 3. Generate player ID
      const year = new Date().toLocaleString("en-US", { timeZone: "Africa/Kampala" }).split("/")[2]?.slice(0, 4) || String(new Date().getFullYear());
      const last = await client.query("SELECT player_id FROM players WHERE player_id LIKE $1 ORDER BY player_id DESC LIMIT 1", [`OTF-${year}-%`]);
      const nextNum = last ? Number((last.rows[0].player_id as string).split("-").pop()) + 1 : 1;
      const playerId = `OTF-${year}-${String(nextNum).padStart(4, "0")}`;

      // 4. Handle file uploads
      const passportFile = formData.get("passport_photo") as File | null;
      const nationalIdFile = formData.get("national_id_photo") as File | null;

      let photographUrl: string | null = null;
      const documentsToInsert: Array<{
        document_type: string;
        file_url: string;
        file_name: string;
        file_size: number;
        mime_type: string;
        expiry_date: string | null;
      }> = [];

      const saveFile = async (file: File): Promise<string> => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const filePath = path.join(UPLOAD_DIR, safeName);
        fs.writeFileSync(filePath, buffer);
        return `/api/kyc/document/${safeName}`;
      };

      if (passportFile) {
        photographUrl = await saveFile(passportFile);
        documentsToInsert.push({
          document_type: "passport_photo",
          file_url: photographUrl,
          file_name: passportFile.name,
          file_size: passportFile.size,
          mime_type: passportFile.type || "application/octet-stream",
          expiry_date: null,
        });
      }

      if (nationalIdFile) {
        const nationalIdUrl = await saveFile(nationalIdFile);
        documentsToInsert.push({
          document_type: "national_id",
          file_url: nationalIdUrl,
          file_name: nationalIdFile.name,
          file_size: nationalIdFile.size,
          mime_type: nationalIdFile.type || "application/octet-stream",
          expiry_date: null,
        });
      }

      // 5. Create player record
      const playerResult = await client.query(
        `INSERT INTO players (player_id, user_id, full_name, date_of_birth, gender, nationality,
           national_id, passport_number, phone, residential_address,
           emergency_contact_name, emergency_contact_number, photograph_url,
           primary_position, secondary_position, preferred_foot, jersey_number,
           previous_club, football_experience, player_category, registration_date,
           status, kyc_status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,'pending','not_submitted',now(),now())
         RETURNING id, player_id, full_name, status, kyc_status, user_id`,
        [
          playerId, userId, data.full_name, data.date_of_birth || null, data.gender || null,
          data.nationality || null, data.national_id, data.passport_number || null, data.phone,
          data.residential_address || null, data.emergency_contact_name || null,
          data.emergency_contact_number || null, photographUrl,
          data.primary_position || null, data.secondary_position || null, data.preferred_foot || null,
          data.jersey_number || null, data.previous_club || null, data.football_experience || null,
          data.player_category || null, data.registration_date || null,
        ]
      );
      const player = playerResult.rows[0];

      // 6. Insert document records
      for (const doc of documentsToInsert) {
        await client.query(
          `INSERT INTO player_documents (player_id, document_type, document_reference, file_url, file_name, file_size, mime_type, upload_date, expiry_date, verification_status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,now(),$8,'not_submitted')`,
          [player.id, doc.document_type, doc.document_type, doc.file_url, doc.file_name,
           doc.file_size, doc.mime_type, doc.expiry_date]
        );
      }

      // 7. Create player_approvals record
      await client.query(
        `INSERT INTO player_approvals (player_id, status, reviewed_by, reason) VALUES ($1,'pending',NULL,'Registration submitted')`,
        [player.id]
      );

      // 8. Audit log
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
         VALUES ($1,'PLAYER_SELF_REGISTERED','player',$2,null,$3,null,null)`,
        [userId, player.id, JSON.stringify({ player_id: playerId, full_name: data.full_name })]
      );

      // 9. Send welcome email (non-blocking — don't fail registration if email fails)
      void sendWelcomeEmail({
        to: data.email,
        playerName: data.full_name,
        playerId: player.player_id,
      }).catch(() => {
        // Email failures should not block registration
      });

      return NextResponse.json({
        ok: true,
        player: { id: player.id, player_id: player.player_id, full_name: player.full_name, status: player.status, kyc_status: player.kyc_status },
        user: { id: userId, email: data.email, username, role: "player", is_active: false },
        message: "Registration submitted successfully. Your account is pending administrator approval.",
      }, { status: 201 });
    });
  } catch (e: unknown) {
    const err = e as Error & { code?: string; name?: string; errors?: unknown };
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors }, { status: 400 });
    if (err.code === "DB_UNAVAILABLE") return NextResponse.json({ error: err.message }, { status: 503 });
    return NextResponse.json({ error: err.message || "Failed to register player" }, { status: 500 });
  }
}
