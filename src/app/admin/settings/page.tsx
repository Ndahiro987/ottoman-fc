import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { DashboardLayout, PageHeader } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";

async function getSettings() {
  const result = await db.query(
    `SELECT setting_key, setting_value, updated_at
     FROM club_settings
     ORDER BY setting_key ASC`
  );
  return result.rows;
}

export default async function SettingsPage() {
  try {
    await requireDatabase();
  } catch {
    redirect("/database-unavailable");
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "administrator") redirect("/login?error=access_denied");

  let settings;
  try {
    settings = await getSettings();
  } catch {
    settings = [];
  }

  return (
    <DashboardLayout role={user.role} userName={user.first_name || user.username}>
      <PageHeader
        title="Settings"
        description="Configure club settings and preferences."
      />

      <div className="mb-6 flex items-center gap-3">
        <Settings size={20} />
        <h2 className="text-xl font-bold text-charcoal">Settings</h2>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-gray-secondary">
                      No settings configured.
                    </TableCell>
                  </TableRow>
                ) : (
                  settings.map((s) => (
                    <TableRow key={s.setting_key}>
                      <TableCell className="font-medium text-charcoal">{s.setting_key}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{s.setting_value ?? "\u2014"}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">
                        {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : "\u2014"}
                      </TableCell>
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
