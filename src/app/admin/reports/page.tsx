import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { DashboardLayout, PageHeader } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";

async function getReports() {
  const result = await db.query(
    `SELECT 'players' AS report_type, count(*)::text AS value FROM players
     UNION ALL
     SELECT 'active_players', count(*)::text FROM players WHERE status = 'active'
     UNION ALL
     SELECT 'pending_registrations', count(*)::text FROM players WHERE status = 'pending'
     UNION ALL
     SELECT 'contracts', count(*)::text FROM contracts
     UNION ALL
     SELECT 'pending_kyc', count(*)::text FROM player_documents WHERE verification_status = 'pending_review'
     UNION ALL
     SELECT 'upcoming_matches', count(*)::text FROM matches WHERE match_date > now() AND status = 'scheduled'`
  );
  return result.rows;
}

export default async function ReportsPage() {
  try {
    await requireDatabase();
  } catch {
    redirect("/database-unavailable");
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "administrator") redirect("/login?error=access_denied");

  let reports;
  try {
    reports = await getReports();
  } catch {
    reports = [];
  }

  return (
    <DashboardLayout role={user.role} userName={user.first_name || user.username}>
      <PageHeader
        title="Reports"
        description="Aggregate club statistics and key figures."
      />

      <div className="mb-6 flex items-center gap-3">
        <Activity size={20} />
        <h2 className="text-xl font-bold text-charcoal">Reports</h2>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-gray-secondary">
                      No report data available.
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((r) => (
                    <TableRow key={r.report_type}>
                      <TableCell className="font-medium text-charcoal">{r.report_type.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-sm font-mono text-charcoal">{r.value}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
