"use strict";

import { sign, verify, type JwtPayload, type SignOptions } from "jsonwebtoken";
import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const COOKIE_NAME = "ottomanfc_token";

export type UserRole = "administrator" | "coach" | "player";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  role: UserRole;
  is_active: boolean;
  permissions: string[];
}

export interface TokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashValue: string): Promise<boolean> {
  return compare(password, hashValue);
}

export function generateToken(user: AuthUser): string {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  return sign(
    payload,
    JWT_SECRET as string,
    { expiresIn: JWT_EXPIRES_IN as string } as unknown as SignOptions
  );
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verify(token, JWT_SECRET as unknown as string) as unknown as TokenPayload;

    const result = await db.query(
      `SELECT u.id, u.email, u.username, u.first_name, u.last_name, u.phone,
              u.role, u.is_active
       FROM users u
       WHERE u.id = $1`,
      [decoded.sub]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    if (!row.is_active) return null;

    const permissions = await getUserPermissions(row.id);

    return {
      id: row.id,
      email: row.email,
      username: row.username,
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone,
      role: row.role as UserRole,
      is_active: row.is_active,
      permissions,
    };
  } catch {
    return null;
  }
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const result = await db.query(
    `SELECT DISTINCT p.code
     FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     JOIN user_roles ur ON ur.role_id = rp.role_id
     WHERE ur.user_id = $1`,
    [userId]
  );
  return result.rows.map((r) => r.code);
}

export async function hasPermission(permission: string): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  return user.permissions.includes(permission);
}

export async function requirePermission(permission: string): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    const err = new Error("Unauthorized") as Error & { status: number };
    err.status = 401;
    throw err;
  }
  if (!user.permissions.includes(permission)) {
    const err = new Error("Forbidden") as Error & { status: number };
    err.status = 403;
    throw err;
  }
  return user;
}

export async function requireRole(roles: UserRole[]): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    const err = new Error("Unauthorized") as Error & { status: number };
    err.status = 401;
    throw err;
  }
  if (!roles.includes(user.role as UserRole)) {
    const err = new Error("Forbidden") as Error & { status: number };
    err.status = 403;
    throw err;
  }
  return user;
}

export async function authenticateUser(
  identifier: string,
  password: string
): Promise<AuthUser | null> {
  const result = await db.query(
    `SELECT id, email, username, first_name, last_name, phone, role, is_active, password_hash
     FROM users
     WHERE (email = $1 OR username = $1)`,
    [identifier]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const passwordValid = await verifyPassword(password, row.password_hash);

  if (!passwordValid) return null;

  await db.query("UPDATE users SET last_login_at = now() WHERE id = $1", [row.id]);

  const permissions = await getUserPermissions(row.id);

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    first_name: row.first_name,
    last_name: row.last_name,
    phone: row.phone,
    role: row.role as UserRole,
    is_active: row.is_active,
    permissions,
  };
}

export async function auditLog({
  userId,
  action,
  entityType,
  entityId,
  oldValues,
  newValues,
  ipAddress,
  userAgent,
}: {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await db.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [userId || null, action, entityType || null, entityId || null,
     oldValues ? JSON.stringify(oldValues) : null,
     newValues ? JSON.stringify(newValues) : null,
     ipAddress || null, userAgent || null]
  );
}
