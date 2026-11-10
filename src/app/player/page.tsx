import { redirect } from "next/navigation";
import * as React from "react";
import { getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { DashboardLayout, PageHeader, StatCard } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  FileText,
  Banknote,
  Activity,
  Calendar,
  ClipboardList,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getPlayerStats(playerId: string) {
  const contract = await db.query(
    `SELECT status, expiry_date FROM contracts WHERE player_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [playerId]
  );
  return contract.rows[0] || null;
}

export default async function PlayerDashboard() {
  try {
    await requireDatabase();
  } catch {
    redirect("/database-unavailable");
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "player") redirect("/login?error=access_denied");

  const player = await db.query("SELECT * FROM players WHERE user_id = $1", [user.id]).catch(() => ({ rows: [] }));
  const playerRow = player.rows[0];
  let contract = null;
  if (playerRow) {
    contract = await db.query(
      `SELECT status, expiry_date, agreed_remuneration, currency FROM contracts WHERE player_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [playerRow.id]
    ).then((r) => r.rows[0] || null).catch(() => null);
  }

  return (
    <DashboardLayout role={user.role} userName={user.first_name || user.username}>
      <PageHeader
        title="Player Portal"
        description="Your personal Ottoman FC profile, contract, and performance information."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Registration Status" value={playerRow ? playerRow.status : "Not registered"} subtitle="Player status" icon="user" />
        <StatCard title="KYC Status" value={playerRow ? playerRow.kyc_status : "Not submitted"} subtitle="Identity verification" icon="fileText" />
        <StatCard title="Contract" value={contract ? contract.status : "None"} subtitle="Current agreement" icon="banknote" />
        <StatCard title="Player ID" value={playerRow ? playerRow.player_id : "\u2014"} subtitle="Unique identifier" icon="layoutDashboard" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {playerRow ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-secondary">Full name</span>
                  <span className="text-charcoal font-medium">{playerRow.full_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-secondary">Player ID</span>
                  <span className="text-charcoal font-medium">{playerRow.player_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-secondary">Category</span>
                  <span className="text-charcoal font-medium">{playerRow.player_category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-secondary">Position</span>
                  <span className="text-charcoal font-medium">{playerRow.primary_position}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-secondary">Status</span>
                  <Badge variant={playerRow.status === "active" ? "success" : "gray"}>{playerRow.status}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-secondary">KYC</span>
                  <Badge variant={playerRow.kyc_status === "approved" ? "success" : "warning"}>{playerRow.kyc_status}</Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-secondary">
                No player record linked to your account yet. Contact the administrator.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <PlayerQuickLink href="/player/profile" icon={User} label="View Profile" />
            <PlayerQuickLink href="/player/contract" icon={FileText} label="View Contract" />
            <PlayerQuickLink href="/player/payments" icon={Banknote} label="View Payments" />
            <PlayerQuickLink href="/player/performance" icon={Activity} label="View Performance" />
            <PlayerQuickLink href="/player/matches" icon={Calendar} label="Match History" />
            <PlayerQuickLink href="/player/training" icon={ClipboardList} label="Training Schedule" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function PlayerQuickLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-charcoal hover:bg-gray-light transition-colors"
    >
      <Icon size={18} />
      {label}
    </a>
  );
}
