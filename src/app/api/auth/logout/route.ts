"use strict";

import { NextResponse } from "next/server";
import { clearAuthCookie, auditLog } from "@/lib/auth";

export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ ok: true, message: "Logged out." });
}
