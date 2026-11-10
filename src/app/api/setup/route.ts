"use strict";

import { NextResponse } from "next/server";
import { initializeSchema, db, seedDatabase } from "@/lib/db";

async function query(text: string, params?: unknown[]) {
  return db.query(text, params);
}

export async function POST() {
  try {
    // One-time guard: only allow setup when no users exist yet
    const existing = await query("SELECT id FROM users LIMIT 1");
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { ok: false, error: "Setup has already been completed." },
        { status: 409 }
      );
    }

    await initializeSchema();
    await seedDatabase();

    // Ensure default roles exist
    await query(
      `INSERT INTO roles (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
      ["administrator", "Full system access"]
    );
    await query(
      `INSERT INTO roles (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
      ["coach", "Coaching and team management"]
    );
    await query(
      `INSERT INTO roles (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
      ["player", "Player portal access"]
    );

    // Ensure default permissions exist
    const permissions = [
      ["players.view", "View player records"],
      ["players.create", "Create player registrations"],
      ["players.edit", "Edit player records"],
      ["players.approve", "Approve/reject player registrations"],
      ["kyc.view", "View KYC documents"],
      ["kyc.review", "Review and verify KYC documents"],
      ["contracts.view", "View contracts"],
      ["contracts.create", "Create contracts"],
      ["contracts.edit", "Edit contracts"],
      ["contracts.approve", "Approve/terminate contracts"],
      ["payments.view", "View payment records"],
      ["payments.create", "Create payment requests"],
      ["payments.approve", "Approve/reject payments"],
      ["payments.confirm", "Confirm payments as paid"],
      ["teams.manage", "Manage teams"],
      ["lineups.create", "Create lineups"],
      ["matches.manage", "Manage matches"],
      ["training.manage", "Manage training sessions"],
      ["tactical.create", "Create tactical plans"],
      ["performance.view", "View performance scores"],
      ["reports.view", "View reports"],
      ["reports.export", "Export reports"],
      ["notifications.manage", "Manage notifications"],
      ["users.manage", "Manage user accounts"],
      ["settings.manage", "Manage platform settings"],
      ["audit.view", "View audit logs"],
    ];
    for (const [code, description] of permissions) {
      await query(
        `INSERT INTO permissions (code, description) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING`,
        [code, description]
      );
    }

    // Default club settings
    await query(
      `INSERT INTO club_settings (club_name, platform_name, default_currency, timezone, player_id_format, contract_reminder_intervals)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO NOTHING`,
      ["OTTOMAN FC", "OTTOMAN FC CONNECT", "UGX", "Africa/Kampala", "OTF-YYYY-NNNN", "[90, 60, 30, 7]"]
    );

    return NextResponse.json({
      ok: true,
      message: "Database initialized. Create your first administrator account at /setup.",
    });
  } catch (error: unknown) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
