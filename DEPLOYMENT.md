# Ottoman FC Connect - Deployment Guide

## Overview

Ottoman FC Connect is a Next.js 16 admin dashboard for football club management, featuring authentication, player registration, KYC, contracts, payments, matches, training, tactical board, performance analytics, notifications, and audit logs.

## Tech Stack

- **Framework:** Next.js 16 (App Router, webpack)
- **Styling:** Tailwind CSS v3
- **Language:** TypeScript
- **Database:** PostgreSQL 18
- **ORM/Driver:** node-postgres (pg)
- **Authentication:** JWT + bcrypt (cookie-based sessions)
- **Forms:** React Hook Form + Zod
- **UI:** Custom component library (shadcn-like)

## Prerequisites

- Node.js v22+
- PostgreSQL 18+
- npm

## Environment Configuration

Copy `.env.example` to `.env` and adjust:

```bash
cp .env.example .env
```

Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://ottomanfc:ottomanfc_dev@localhost:5432/ottomanfc` |
| `DB_HOST` | Database host | `127.0.0.1` |
| `DB_PORT` | Database port | `5432` |
| `DB_USER` | Database user | `ottomanfc` |
| `DB_PASSWORD` | Database password | `ottomanfc_dev` |
| `DB_NAME` | Database name | `ottomanfc` |
| `NEXTAUTH_SECRET` | Session signing secret | Change in production |
| `JWT_SECRET` | JWT signing secret | Change in production |
| `JWT_EXPIRES_IN` | JWT expiry | `7d` |
| `UPLOAD_DIR` | KYC document storage path | `./uploads` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `10485760` |
| `DEFAULT_CURRENCY` | Default currency | `UGX` |
| `TIMEZONE` | Club timezone | `Africa/Kampala` |

## Database Setup

### 1. Start PostgreSQL

Ensure PostgreSQL is running and accessible on the configured port.

### 2. Create database and role

```bash
node scripts/setup-db.js
```

This creates:
- Role `ottomanfc` (login)
- Database `ottomanfc` (owned by ottomanfc)
- Applies `database/schema.sql` (35 tables)

### 3. Seed initial data

Use the setup API endpoint:

```bash
curl -X POST http://localhost:3000/api/setup
```

This seeds the schema, roles, permissions, and default users:
- `admin` / `admin123` (administrator)
- `coach` / `coach123` (coach)
- `player` / `player123` (player)

## Running the Application

### Development

```bash
npm run dev --webpack
```

Runs on `http://localhost:3000`.

> **Note:** The `--webpack` flag is required because Tailwind v4 + turbopack is incompatible. The dev server uses webpack.

### Production Build

```bash
npm run build --webpack
```

Start the production server:

```bash
npm start
```

Or use a process manager like PM2:

```bash
pm2 start npm -- start
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev --webpack` | Start dev server (webpack) |
| `npm run build --webpack` | Production build (webpack) |
| `npm start` | Start production server |

## Authentication & Authorization

- **Roles:** administrator, coach, player
- **Permissions:** Fine-grained access control via `role_permissions` table
- **Middleware:** Path-based protection (`/admin`, `/coach`, `/player`)
- **Session:** JWT stored in httpOnly cookie

### Default Users (after seeding)

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | administrator |
| coach | coach123 | coach |
| player | player123 | player |

## File Uploads (KYC Documents)

- Uploads stored on disk under `cwd/uploads/`
- Served through `/api/kyc/document/[name]` with RBAC
- Players can only access their own documents; admins/coaches can access all

## Database Unavailable Handling

If PostgreSQL is unreachable, the app gracefully degrades to `/database-unavailable`. API routes return 503 with `DB_UNAVAILABLE` error code.

## Port Conflicts

If port 5432 is occupied by another PostgreSQL instance:
1. Start a secondary PostgreSQL instance on a different port (e.g., 5434)
2. Update `DATABASE_URL` / `DB_PORT` in `.env`
3. Run `node scripts/setup-db.js` against the new instance

## Known Limitations

- Tailwind v4 + turbopack is incompatible; webpack is required
- `cookies()` is async in Next 15/16; auth helpers are async
- Next.js middleware deprecation warning (use `proxy` convention in future)

## Project Structure

```
src/
  app/
    api/                # API routes (auth, players, kyc, contracts, payments, matches, training, notifications, audit-logs, setup)
    admin/              # Admin dashboard pages
    coach/              # Coach dashboard pages
    player/             # Player dashboard pages
    login/              # Login page
    dashboard/          # Public dashboard redirect
    database-unavailable/ # DB fallback page
  components/
    ui/                 # Base UI components (button, card, table, etc.)
    layout/             # Dashboard layout, sidebar, header
    branding/           # Logo, brand assets
  lib/
    db.ts               # PostgreSQL pool, transactions, schema init
    auth.ts             # JWT, bcrypt, session, permissions
  types/                # TypeScript interfaces
database/
  schema.sql            # PostgreSQL schema (35 tables)
scripts/
  setup-db.js           # Database initialization script
```

## Security Notes

- Change `NEXTAUTH_SECRET` and `JWT_SECRET` in production
- Use HTTPS in production
- Rotate default passwords after first login
- File uploads are served with RBAC checks
- All mutations require appropriate permissions
