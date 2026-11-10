"use strict";

import { env } from "@/config/env";

import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";

let transporter: Transporter | null = null;
let resendInstance: Resend | null = null;

function getSmtpTransport(): Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT || "587", 10),
    secure: env.SMTP_SECURE === "true",
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });

  return transporter;
}

function getResend(): Resend {
  if (resendInstance) return resendInstance;
  resendInstance = new Resend(env.RESEND_API_KEY!);
  return resendInstance;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  const e = env;

  try {
    if (e.RESEND_API_KEY) {
      const resend = getResend();
      await resend.emails.send({
        from: e.RESEND_FROM || e.SMTP_FROM || "noreply@ottomanfc.com",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      return { ok: true };
    }

    if (e.SMTP_HOST && e.SMTP_USER && e.SMTP_PASSWORD) {
      const transport = getSmtpTransport();
      await transport.sendMail({
        from: `${e.SMTP_FROM_NAME || "OTTOMAN FC Connect"} <${e.SMTP_FROM}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      return { ok: true };
    }

    return {
      ok: false,
      error: "No email provider configured. Set SMTP_* or RESEND_API_KEY in .env.local",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return { ok: false, error: message };
  }
}

export async function sendVerificationEmail({
  to,
  playerName,
  playerId,
  status,
}: {
  to: string;
  playerName: string;
  playerId: string;
  status: "approved" | "rejected";
}): Promise<{ ok: boolean; error?: string }> {
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  if (status === "approved") {
    return sendEmail({
      to,
      subject: "✅ Your Ottoman FC Player Registration is Approved",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #166534;">Welcome to Ottoman FC Connect, ${playerName}!</h2>
          <p>Great news — your player registration has been <strong>approved</strong> by the club administrator.</p>
          <p><strong>Player ID:</strong> ${playerId}</p>
          <p>You can now sign in to the player portal at:</p>
          <a href="${appUrl}/login" style="background-color: #166534; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Sign In to Player Portal</a>
          <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
            If you did not request this, please contact the club administrator immediately.
          </p>
        </div>
      `,
      text: `Welcome to Ottoman FC Connect, ${playerName}! Your player registration has been approved. Your Player ID is ${playerId}. Sign in at ${appUrl}/login`,
    });
  }

  return sendEmail({
    to,
    subject: "❌ Ottoman FC Player Registration Update",
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #dc2626;">Registration Update — ${playerName}</h2>
        <p>We regret to inform you that your player registration has been <strong>rejected</strong> by the club administrator.</p>
        <p><strong>Player ID:</strong> ${playerId}</p>
        <p>Please contact the club administrator for more details or to reapply.</p>
        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
          If you believe this is an error, please reach out to the club directly.
        </p>
      </div>
    `,
    text: `Registration Update — ${playerName}. Your player registration has been rejected. Player ID: ${playerId}. Contact the club administrator for details.`,
  });
}

export async function sendPasswordResetEmail({
  to,
  playerName,
  resetToken,
}: {
  to: string;
  playerName: string;
  resetToken: string;
}): Promise<{ ok: boolean; error?: string }> {
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  return sendEmail({
    to,
    subject: "🔐 Reset Your Ottoman FC Connect Password",
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1f2937;">Password Reset Request</h2>
        <p>Hello ${playerName},</p>
        <p>You requested a password reset for your Ottoman FC Connect account.</p>
        <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
          This link expires in 60 minutes. If you did not request this, please ignore this email.
        </p>
      </div>
    `,
    text: `Hello ${playerName}, You requested a password reset. Click here: ${resetUrl}. This link expires in 60 minutes.`,
  });
}

export async function sendWelcomeEmail({
  to,
  playerName,
  playerId,
}: {
  to: string;
  playerName: string;
  playerId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  return sendEmail({
    to,
    subject: "🎉 Welcome to Ottoman FC Connect",
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #166534;">Welcome, ${playerName}!</h2>
        <p>Thank you for registering with Ottoman FC Connect.</p>
        <p><strong>Player ID:</strong> ${playerId}</p>
        <p>Your account is currently pending administrator approval. You will receive another email once your registration is approved.</p>
        <a href="${appUrl}/login" style="background-color: #166534; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Login</a>
      </div>
    `,
    text: `Welcome, ${playerName}! Your Player ID is ${playerId}. Your account is pending approval. Go to ${appUrl}/login to sign in once approved.`,
  });
}
