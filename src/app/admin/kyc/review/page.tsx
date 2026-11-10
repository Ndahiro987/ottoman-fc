import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { DashboardLayout, PageHeader } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

export const dynamic = "force-dynamic";

async function getKycDocuments(status?: string) {
  let query = `
    SELECT d.id, d.player_id, p.full_name AS player_name, p.player_id AS player_code,
           d.document_type, d.file_name, d.file_size, d.mime_type,
           d.upload_date, d.expiry_date, d.verification_status,
           d.reviewing_administrator, d.review_date, d.rejection_reason, d.created_at
    FROM player_documents d
    JOIN players p ON p.id = d.player_id
    WHERE 1=1
  `;
  const params: unknown[] = [];
  if (status) {
    query += ` AND d.verification_status = $${params.length + 1}`;
    params.push(status);
  }
  query += ` ORDER BY d.upload_date DESC`;
  const result = await db.query(query, params);
  return result.rows;
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    not_submitted: "gray",
    pending: "warning",
    approved: "success",
    rejected: "danger",
    requires_resubmission: "primary",
  };
  return <Badge variant={(map[status] || "gray") as "success" | "warning" | "gray" | "danger" | "primary"}>{status}</Badge>;
};

export default async function KycReviewPage() {
  try {
    await requireDatabase();
  } catch {
    redirect("/database-unavailable");
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "administrator") redirect("/login?error=access_denied");

  const [pendingDocs, allDocs] = await Promise.all([
    getKycDocuments("pending").catch(() => []),
    getKycDocuments().catch(() => []),
  ]);

  return (
    <DashboardLayout role={user.role} userName={user.first_name || user.username}>
      <PageHeader
        title="KYC Document Review"
        description="Review and verify player identity documents."
      />

      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pending Review</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-charcoal">{pendingDocs.length}</p>
            <p className="text-sm text-gray-secondary">documents awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Submitted</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-charcoal">{allDocs.length}</p>
            <p className="text-sm text-gray-secondary">documents on file</p>
          </CardContent>
        </Card>
      </div>

      {pendingDocs.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pending KYC Documents</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDocs.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-charcoal">
                        {d.player_name} <span className="text-xs text-gray-secondary block">({d.player_code})</span>
                      </TableCell>
                      <TableCell className="text-sm capitalize">{d.document_type}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{d.file_name}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">
                        {d.upload_date ? new Date(d.upload_date).toLocaleDateString() : "\u2014"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Approve KYC for ${d.player_name}?`)) {
                                fetch(`/api/kyc/${d.id}/review`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ verification_status: "approved" }),
                                }).then(() => window.location.reload());
                              }
                            }}
                          >
                            <Check className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const reason = window.prompt(`Rejection reason for ${d.player_name}?:`);
                              if (reason !== null) {
                                fetch(`/api/kyc/${d.id}/review`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ verification_status: "rejected", rejection_reason: reason }),
                                }).then(() => window.location.reload());
                              }
                            }}
                          >
                            <X className="w-4 h-4 mr-1" /> Reject
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
          <CardTitle>All KYC Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-secondary">
                      No KYC documents found.
                    </TableCell>
                  </TableRow>
                ) : (
                  allDocs.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-charcoal">{d.player_name}</TableCell>
                      <TableCell className="text-sm capitalize">{d.document_type}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{d.file_name}</TableCell>
                      <TableCell>{statusBadge(d.verification_status)}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">
                        {d.upload_date ? new Date(d.upload_date).toLocaleDateString() : "\u2014"}
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
