import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { DashboardLayout, PageHeader } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

async function getAuditLogs() {
  const result = await db.query(
    `SELECT al.id, al.action, al.entity_type, al.entity_id, al.old_values, al.new_values, al.ip_address, al.created_at, u.full_name AS user_name
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC
     LIMIT 100`
  );
  return result.rows;
}

const actionBadge = (action: string) => {
  const map: Record<string, string> = {
    LOGIN: "success",
    LOGIN_FAILED: "danger",
    PLAYER_REGISTERED: "success",
    PLAYER_REGISTRATION_APPROVED: "success",
    PLAYER_REGISTRATION_REJECTED: "warning",
    KYC_REVIEW: "info",
    KYC_UPLOAD: "info",
    CONTRACT_CREATED: "success",
    CONTRACT_ACTIVE: "success",
    CONTRACT_TERMINATED: "danger",
    PAYMENT_REQUEST_CREATED: "info",
    PAYMENT_APPROVED: "success",
    PAYMENT_REJECTED: "danger",
    MATCH_CREATED: "success",
    MATCH_UPDATED: "info",
    TRAINING_SESSION_CREATED: "success",
    USER_CREATED: "success",
  };
  return <Badge variant={(map[action] || "gray") as "success" | "warning" | "gray" | "danger" | "primary"}>{action}</Badge>;
};

export default async function AuditLogsPage() {
  try {
    await requireDatabase();
  } catch {
    redirect("/database-unavailable");
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "administrator") redirect("/login?error=access_denied");

  let logs;
  try {
    logs = await getAuditLogs();
  } catch {
    logs = [];
  }

  return (
    <DashboardLayout role={user.role} userName={user.first_name || user.username}>
      <PageHeader
        title="Audit Logs"
        description="View system activity and administrator action history."
      />

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Events</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-charcoal">{logs.length}</p>
            <p className="text-sm text-gray-secondary">logged events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Today</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-charcoal">
              {logs.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length}
            </p>
            <p className="text-sm text-gray-secondary">events today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Failed Logins</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-danger">
              {logs.filter((l) => l.action === "LOGIN_FAILED").length}
            </p>
            <p className="text-sm text-gray-secondary">failed login attempts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-secondary">
                      No audit events found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm text-gray-secondary font-mono">
                        {l.created_at ? new Date(l.created_at).toLocaleString() : "\u2014"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-secondary">
                        {l.user_name || "System"}
                      </TableCell>
                      <TableCell>{actionBadge(l.action)}</TableCell>
                      <TableCell className="text-sm capitalize text-gray-secondary">
                        {l.entity_type || "\u2014"}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-gray-secondary">{l.entity_id || "\u2014"}</TableCell>
                      <TableCell className="text-sm font-mono text-gray-secondary">{l.ip_address || "\u2014"}</TableCell>
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
