import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { DashboardLayout, PageHeader } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

async function getTeams() {
  const result = await db.query(
    `SELECT t.id, t.name, t.category, t.created_at,
            u.first_name, u.last_name, u.username
     FROM teams t
     LEFT JOIN coaches c ON c.id = t.coach_id
     LEFT JOIN users u ON u.id = c.user_id
     ORDER BY t.name ASC`
  );
  return result.rows;
}

export default async function TeamsPage() {
  try {
    await requireDatabase();
  } catch {
    redirect("/database-unavailable");
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "administrator") redirect("/login?error=access_denied");

  let teams;
  try {
    teams = await getTeams();
  } catch {
    teams = [];
  }

  return (
    <DashboardLayout role={user.role} userName={user.first_name || user.username}>
      <PageHeader
        title="Teams"
        description="Manage club teams and their assigned coaches."
      />

      <div className="mb-6 flex items-center gap-3">
        <Trophy size={20} />
        <h2 className="text-xl font-bold text-charcoal">Teams</h2>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Coach</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-secondary">
                      No teams found.
                    </TableCell>
                  </TableRow>
                ) : (
                  teams.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-charcoal">{t.name}</TableCell>
                      <TableCell className="text-sm">{t.category || "\u2014"}</TableCell>
                      <TableCell className="text-sm">
                        {t.first_name && t.last_name
                          ? `${t.first_name} ${t.last_name}`
                          : t.username
                          ? t.username
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-secondary">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : "\u2014"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {teams.length === 0 && (
        <div className="mt-6 p-6 rounded-xl bg-amber-50 border border-amber-100">
          <p className="text-sm text-amber-800">
            No teams have been created yet. Add teams through the database or an admin form.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
