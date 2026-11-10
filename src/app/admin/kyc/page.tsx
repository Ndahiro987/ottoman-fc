"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/dashboard-layout";
import { useToastActions } from "@/components/ui/toast";
import { Shield, FileText, Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    not_submitted: "gray",
    pending_review: "warning",
    approved: "success",
    rejected: "danger",
    requires_resubmission: "warning",
    expired: "gray",
  };
  return <Badge variant={(map[status] || "gray") as any}>{status.replace(/_/g, " ")}</Badge>;
};

export default function KYCPage() {
  const { success, error } = useToastActions();
  const [docs, setDocs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [filter, setFilter] = React.useState("pending_review");

  React.useEffect(() => {
    loadDocs();
  }, [filter]);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kyc?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
      }
    } catch {
      error("Failed to load KYC documents");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: string, status: "approved" | "rejected", reason: string) => {
    try {
      const res = await fetch(`/api/kyc/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_status: status, rejection_reason: reason }),
      });
      if (!res.ok) throw new Error("Review failed");
      success(`Document ${status}`);
      loadDocs();
    } catch {
      error("Failed to review document");
    }
  };

  return (
    <DashboardLayout role="administrator" userName="Administrator">
      <PageHeader
        title="KYC Document Review"
        description="Verify player identity documents. Only administrators can approve or reject KYC submissions."
      />

      <div className="flex gap-2 mb-6">
        {["pending_review", "approved", "rejected", "requires_resubmission"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "primary" : "outline"}
            onClick={() => setFilter(f)}
            size="sm"
          >
            {f.replace(/_/g, " ")}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents Awaiting Review</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-secondary">
                      No documents to review.
                    </TableCell>
                  </TableRow>
                ) : (
                  docs.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-charcoal">{d.player_name}</TableCell>
                      <TableCell className="text-sm">{d.document_type}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{d.document_reference || "\u2014"}</TableCell>
                      <TableCell className="text-sm">{new Date(d.upload_date).toLocaleDateString()}</TableCell>
                      <TableCell>{statusBadge(d.verification_status)}</TableCell>
                      <TableCell>
                        {d.verification_status === "pending_review" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleReview(d.id, "approved", "")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReview(d.id, "rejected", "Document not valid")}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
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
