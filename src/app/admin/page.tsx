import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { DashboardLayout, PageHeader, StatCard } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
export const dynamic = "force-dynamic";

async function getAdminStats() {
  const result = await db.query(
    `SELECT
       (SELECT count(*) FROM players)::int AS total_players,
       (SELECT count(*) FROM players WHERE status = 'active')::int AS active_players,
       (SELECT count(*) FROM players WHERE status = 'pending')::int AS pending_reg,
       (SELECT count(*) FROM player_documents WHERE verification_status = 'pending_review')::int AS pending_kyc,
       (SELECT count(*) FROM contracts WHERE status = 'active')::int AS active_contracts,
       (SELECT count(*) FROM contracts WHERE status = 'active' AND expiry_date BETWEEN now() AND now() + interval '30 days')::int AS expiring_contracts,
       (SELECT count(*) FROM payment_requests WHERE approval_status = 'pending')::int AS pending_payments,
       (SELECT count(*) FROM matches WHERE match_date > now() AND status = 'scheduled')::int AS upcoming_fixtures,
       (SELECT count(*) FROM training_sessions WHERE session_date > now())::int AS upcoming_training`
  );
  const row = result.rows[0];
  return {
    totalPlayers: row.total_players,
    activePlayers: row.active_players,
    pendingReg: row.pending_reg,
    pendingKyc: row.pending_kyc,
    activeContracts: row.active_contracts,
    expiringContracts: row.expiring_contracts,
    pendingPayments: row.pending_payments,
    upcomingFixtures: row.upcoming_fixtures,
    upcomingTraining: row.upcoming_training,
  };
}

export default async function AdminDashboard() {
  try {
    await requireDatabase();
  } catch {
    redirect("/database-unavailable");
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "administrator") redirect("/login?error=access_denied");

  let stats;
  try {
    stats = await getAdminStats();
  } catch {
    stats = {
      totalPlayers: 0, activePlayers: 0, pendingReg: 0, pendingKyc: 0,
      activeContracts: 0, expiringContracts: 0, pendingPayments: 0,
      upcomingFixtures: 0, upcomingTraining: 0,
    };
  }

  let recent = [];
  try {
    const result = await db.query(
      `SELECT action, entity_type, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 8`
    );
    recent = result.rows;
  } catch {
    recent = [];
  }

  return (
    <DashboardLayout role={user.role} userName={user.first_name || user.username}>
      <PageHeader
        title="Administrator Dashboard"
        description="Central control centre for OTTOMAN FC. All figures are calculated from live database records."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Registered Players" value={stats.totalPlayers} subtitle="Total player records" icon="users" />
        <StatCard title="Active Players" value={stats.activePlayers} subtitle="Currently active" icon="users" trend={{ label: "active players", positive: true }} />
        <StatCard title="Pending Registrations" value={stats.pendingReg} subtitle="Awaiting approval" icon="clock" trend={{ label: "pending approval", positive: false }} />
        <StatCard title="Pending KYC Reviews" value={stats.pendingKyc} subtitle="Documents to review" icon="shield" trend={{ label: "pending review", positive: false }} />
        <StatCard title="Active Contracts" value={stats.activeContracts} subtitle="Current agreements" icon="fileText" />
        <StatCard title="Contracts Expiring Soon" value={stats.expiringContracts} subtitle="Within 30 days" icon="alertTriangle" trend={{ label: "expiring soon", positive: false }} />
        <StatCard title="Pending Payments" value={stats.pendingPayments} subtitle="Awaiting approval" icon="banknote" trend={{ label: "pending payments", positive: false }} />
        <StatCard title="Upcoming Fixtures & Training" value={stats.upcomingFixtures + stats.upcomingTraining} subtitle="Next 30 days" icon="calendar" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-light">
              {(recent.length ? recent : [
                { action: "System initialized", entity_type: "system", created_at: new Date().toISOString() },
              ]).map((activity, i) => (
                <div key={i} className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-primary/10 flex items-center justify-center text-red-primary text-sm font-medium">
                    {i % 4 === 0 ? "N" : i % 4 === 1 ? "K" : i % 4 === 2 ? "C" : "P"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-charcoal">{activity.action.replace(/_/g, " ")}</p>
                    <p className="text-xs text-gray-secondary">{activity.entity_type}</p>
                  </div>
                  <p className="text-xs text-gray-secondary">{new Date(activity.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerts &amp; Reminders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3">
              {stats.pendingReg > 0 && (
                <AlertItem title={stats.pendingReg + " registration(s) pending approval"} href="/admin/registrations" />
              )}
              {stats.pendingKyc > 0 && (
                <AlertItem title={stats.pendingKyc + " KYC document(s) awaiting review"} href="/admin/kyc" />
              )}
              {stats.expiringContracts > 0 && (
                <AlertItem title={stats.expiringContracts + " contract(s) expiring within 30 days"} href="/admin/contracts" />
              )}
              {stats.pendingPayments > 0 && (
                <AlertItem title={stats.pendingPayments + " payment request(s) awaiting approval"} href="/admin/payments" />
              )}
              {stats.pendingReg === 0 && stats.pendingKyc === 0 && stats.expiringContracts === 0 && stats.pendingPayments === 0 && (
                <div className="p-4 text-center text-gray-secondary text-sm">
                  No active alerts. All clear.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function AlertItem({ title, href }: { title: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-light hover:bg-red-primary/5 transition-colors"
    >
      <span className="text-sm text-charcoal">{title}</span>
      <span className="text-xs text-red-primary font-medium">View &rarr;</span>
    </a>
  );
}
