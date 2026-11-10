import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { DashboardLayout, PageHeader } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";

async function getLineups() {
  const result = await db.query(
    `SELECT l.id, l.name, l.match_id, l.status, l.created_at,
            m.match_date, m.home_team, m.away_team
     FROM lineups l
     LEFT JOIN matches m ON m.id = l.match_id
     ORDER BY l.created_at DESC`
  );
  return result.rows;
}

export default async function LineupsPage() {
  try {
    await requireDatabase();
  } catch {
    redirect("/database-unavailable");
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "administrator") redirect("/login?error=access_denied");

  let lineups;
  try {
    lineups = await getLineups();
  } catch {
    lineups = [];
  }

  return (
    <DashboardLayout role={user.role} userName={user.first_name || user.username}>
      <PageHeader
        title="Line-ups"
        description="Manage team line-ups and starting elevens for matches."
      />

      <div className="mb-6 flex items-center gap-3">
        <Activity size={20} />
        <h2 className="text-xl font-bold text-charcoal">Line-ups</h2>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead>Match Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-secondary">
                      No line-ups found.
                    </TableCell>
                  </TableRow>
                ) : (
                  lineups.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium text-charcoal">{l.name}</TableCell>
                      <TableCell className="text-sm">{l.home_team && l.away_team ? `${l.home_team} vs ${l.away_team}` : "\u2014"}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{l.match_date ? new Date(l.match_date).toLocaleDateString() : "\u2014"}</TableCell>
                      <TableCell className="text-sm">{l.status || "\u2014"}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{l.created_at ? new Date(l.created_at).toLocaleDateString() : "\u2014"}</TableCell>
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
