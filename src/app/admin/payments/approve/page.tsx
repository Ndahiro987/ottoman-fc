import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { DashboardLayout, PageHeader } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

async function getPaymentRequests(status?: string) {
  let query = `
    SELECT pr.id, pr.request_number, pr.player_id, p.full_name AS player_name, pr.payment_category,
           pr.amount, pr.currency, pr.payment_description, pr.requested_date, pr.approval_status,
           pr.rejection_reason, pr.created_at
    FROM payment_requests pr
    JOIN players p ON p.id = pr.player_id
    WHERE 1=1
  `;
  const params: unknown[] = [];
  if (status) {
    query += ` AND pr.approval_status = $${params.length + 1}`;
    params.push(status);
  }
  query += ` ORDER BY pr.requested_date DESC`;
  const result = await db.query(query, params);
  return result.rows;
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
  };
  return <Badge variant={(map[status] || "gray") as "success" | "warning" | "gray" | "danger" | "primary"}>{status}</Badge>;
};

export default async function PaymentsApprovePage() {
  try {
    await requireDatabase();
  } catch {
    redirect("/database-unavailable");
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "administrator") redirect("/login?error=access_denied");

  const [pendingRequests, allRequests] = await Promise.all([
    getPaymentRequests("pending").catch(() => []),
    getPaymentRequests().catch(() => []),
  ]);

  return (
    <DashboardLayout role={user.role} userName={user.first_name || user.username}>
      <PageHeader
        title="Payment Approvals"
        description="Review and approve or reject player payment requests."
      />

      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pending Approval</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-charcoal">{pendingRequests.length}</p>
            <p className="text-sm text-gray-secondary">payment requests awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Submitted</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-charcoal">{allRequests.length}</p>
            <p className="text-sm text-gray-secondary">payment requests on file</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Value</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-charcoal">
              {pendingRequests.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-secondary">UGX awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {pendingRequests.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pending Payment Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request No.</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.request_number}</TableCell>
                      <TableCell className="font-medium text-charcoal">{r.player_name}</TableCell>
                      <TableCell className="text-sm capitalize">{r.payment_category}</TableCell>
                      <TableCell className="text-sm font-mono text-gray-secondary">
                        {Number(r.amount || 0).toLocaleString()} {r.currency}
                      </TableCell>
                      <TableCell className="text-sm text-gray-secondary">
                        {r.requested_date ? new Date(r.requested_date).toLocaleDateString() : "\u2014"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Approve payment ${r.request_number}?`)) {
                                fetch(`/api/payment-requests/${r.id}/approve`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "approved" }),
                                }).then(() => window.location.reload());
                              }
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const reason = window.prompt(`Rejection reason for ${r.request_number}?:`);
                              if (reason !== null) {
                                fetch(`/api/payment-requests/${r.id}/approve`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "rejected", reason }),
                                }).then(() => window.location.reload());
                              }
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Payment Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request No.</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-secondary">
                      No payment requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  allRequests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.request_number}</TableCell>
                      <TableCell className="font-medium text-charcoal">{r.player_name}</TableCell>
                      <TableCell className="text-sm capitalize">{r.payment_category}</TableCell>
                      <TableCell className="text-sm font-mono text-gray-secondary">
                        {Number(r.amount || 0).toLocaleString()} {r.currency}
                      </TableCell>
                      <TableCell>{statusBadge(r.approval_status)}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">
                        {r.requested_date ? new Date(r.requested_date).toLocaleDateString() : "\u2014"}
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
