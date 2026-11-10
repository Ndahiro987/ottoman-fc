"use strict";

import { z } from "zod";

const envSchema = z.object({
  // Database (Neon)
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Authentication
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // App URL
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Email (SMTP)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  SMTP_FROM_NAME: z.string().optional(),

  // Email (Resend alternative)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().email().optional(),

  // File uploads
  UPLOAD_DIR: z.string().default("./uploads"),

  // Rate limiting
  LOGIN_RATE_LIMIT_WINDOW_MINUTES: z.string().default("15"),
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: z.string().default("5"),
});

type Env = z.infer<typeof envSchema>;

let _env: Env;

export function getEnv(): Env {
  if (_env) return _env;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => i.path.join("."))
      .join(", ");
    throw new Error(
      `❌ Invalid environment variables: ${missing}\n` +
        `Copy .env.example to .env.local and fill in your values.`
    );
  }

  _env = parsed.data;
  return _env;
}

export const env = getEnv();

export function isEmailConfigured(): boolean {
  const e = getEnv();
  return Boolean((e.SMTP_HOST && e.SMTP_USER && e.SMTP_PASSWORD) || e.RESEND_API_KEY);
}
