import { redirect } from "next/navigation";
import * as React from "react";
import { getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { DashboardLayout, PageHeader, StatCard } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  ClipboardList,
  Calendar,
  Activity,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getCoachStats() {
  const result = await db.query(
    `SELECT
       (SELECT count(*) FROM players WHERE status = 'active')::int AS total_players,
       (SELECT count(*) FROM lineups WHERE is_active = true)::int AS pending_lineups,
       (SELECT count(*) FROM matches WHERE match_date > now() AND status = 'scheduled')::int AS upcoming_matches,
       (SELECT count(*) FROM training_sessions WHERE session_date > now())::int AS upcoming_training`
  );
  const row = result.rows[0];
  return {
    totalPlayers: row.total_players,
    pendingLineups: row.pending_lineups,
    upcomingMatches: row.upcoming_matches,
    upcomingTraining: row.upcoming_training,
  };
}

export default async function CoachDashboard() {
  try {
    await requireDatabase();
  } catch {
    redirect("/database-unavailable");
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "coach") redirect("/login?error=access_denied");

  let stats;
  try {
    stats = await getCoachStats();
  } catch {
    stats = { totalPlayers: 0, pendingLineups: 0, upcomingMatches: 0, upcomingTraining: 0 };
  }

  return (
    <DashboardLayout role={user.role} userName={user.first_name || user.username}>
      <PageHeader
        title="Coach Dashboard"
        description="Prepare squads, plan tactics, record performance, and manage training."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Available Players" value={stats.totalPlayers} subtitle="Approved &amp; active" icon="users" />
        <StatCard title="Active Line-ups" value={stats.pendingLineups} subtitle="Saved squads" icon="activity" />
        <StatCard title="Upcoming Matches" value={stats.upcomingMatches} subtitle="Scheduled fixtures" icon="calendar" />
        <StatCard title="Upcoming Training" value={stats.upcomingTraining} subtitle="Scheduled sessions" icon="clipboardList" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <QuickAction href="/coach/lineups" icon={Activity} label="Create Line-up" description="Select starting eleven &amp; substitutes" />
            <QuickAction href="/coach/tactical" icon={ClipboardList} label="Tactical Board" description="Design &amp; project tactics" />
            <QuickAction href="/coach/matches" icon={Calendar} label="Manage Matches" description="Fixtures &amp; match records" />
            <QuickAction href="/coach/training" icon={ClipboardList} label="Training" description="Schedule &amp; attendance" />
            <QuickAction href="/coach/performance" icon={Activity} label="Performance" description="Player scores &amp; analytics" />
            <QuickAction href="/coach/players" icon={Users} label="Player Directory" description="View approved players" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coaching Scope</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="text-sm text-charcoal space-y-2">
              <p>You can view approved players, prepare line-ups, create tactical plans, record match statistics, and manage training.</p>
            </div>
            <div className="pt-3 border-t border-gray-light">
              <Badge variant="gray">Restricted: Cannot approve registrations</Badge>
              <Badge variant="gray">Restricted: Cannot approve payments</Badge>
              <Badge variant="gray">Restricted: No confidential KYC access</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function QuickAction({ href, icon: Icon, label, description }: { href: string; icon: React.ElementType; label: string; description: string }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-light bg-white hover:bg-red-primary/5 hover:border-red-primary transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-red-primary/10 flex items-center justify-center text-red-primary mb-2">
        <Icon size={20} />
      </div>
      <p className="text-sm font-medium text-charcoal text-center">{label}</p>
      <p className="text-xs text-gray-secondary text-center">{description}</p>
    </a>
  );
}
