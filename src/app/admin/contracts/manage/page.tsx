import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { DashboardLayout, PageHeader } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

async function getContracts() {
  const result = await db.query(
    `SELECT c.id, c.contract_id, c.player_id, p.full_name AS player_name, c.contract_type,
            c.commencement_date, c.expiry_date, c.agreed_remuneration, c.currency, c.status, c.created_at
     FROM contracts c
     JOIN players p ON p.id = c.player_id
     ORDER BY c.created_at DESC`
  );
  return result.rows;
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    draft: "gray",
    active: "success",
    terminated: "danger",
    expired: "gray",
  };
  return <Badge variant={(map[status] || "gray") as "success" | "warning" | "gray" | "danger" | "primary"}>{status}</Badge>;
};

export default async function ContractsManagePage() {
  try {
    await requireDatabase();
  } catch {
    redirect("/database-unavailable");
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "administrator") redirect("/login?error=access_denied");

  let contracts;
  try {
    contracts = await getContracts();
  } catch {
    contracts = [];
  }

  return (
    <DashboardLayout role={user.role} userName={user.first_name || user.username}>
      <PageHeader
        title="Contract Management"
        description="Create, view, activate, and terminate player contracts."
      />

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Contracts</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-charcoal">{contracts.length}</p>
            <p className="text-sm text-gray-secondary">contracts on file</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-success">{contracts.filter((c) => c.status === "active").length}</p>
            <p className="text-sm text-gray-secondary">currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Drafts</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-warning">{contracts.filter((c) => c.status === "draft").length}</p>
            <p className="text-sm text-gray-secondary">pending activation</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <Button onClick={() => {
          const playerId = window.prompt("Enter player ID:");
          if (!playerId) return;
          const contractType = window.prompt("Contract type (e.g. Professional, Amateur):");
          if (!contractType) return;
          const startDate = window.prompt("Commencement date (YYYY-MM-DD):");
          if (!startDate) return;
          const expiryDate = window.prompt("Expiry date (YYYY-MM-DD):");
          if (!expiryDate) return;
          const remuneration = window.prompt("Agreed remuneration (UGX):");
          
          fetch("/api/contracts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              player_id: playerId,
              contract_type: contractType,
              commencement_date: startDate,
              expiry_date: expiryDate,
              agreed_remuneration: remuneration ? Number(remuneration) : null,
              currency: "UGX",
            }),
          }).then(() => window.location.reload());
        }}
      >
        <FileText className="w-4 h-4 mr-2" /> Create Contract
      </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Contracts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract ID</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Remuneration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-secondary">
                      No contracts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  contracts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">{c.contract_id}</TableCell>
                      <TableCell className="font-medium text-charcoal">{c.player_name}</TableCell>
                      <TableCell className="text-sm capitalize">{c.contract_type}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{c.commencement_date}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{c.expiry_date}</TableCell>
                      <TableCell className="text-sm font-mono text-gray-secondary">
                        {c.agreed_remuneration !== null ? `${Number(c.agreed_remuneration).toLocaleString()} ${c.currency}` : "\u2014"}
                      </TableCell>
                      <TableCell>{statusBadge(c.status)}</TableCell>
                      <TableCell>
                        {c.status === "draft" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                if (window.confirm(`Activate contract ${c.contract_id}?`)) {
                                  fetch(`/api/contracts/${c.id}/approve`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: "active" }),
                                  }).then(() => window.location.reload());
                                }
                              }}
                            >
                              Activate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const reason = window.prompt(`Reason for terminating ${c.contract_id}?:`);
                                if (reason !== null) {
                                  fetch(`/api/contracts/${c.id}/approve`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: "terminated", reason }),
                                  }).then(() => window.location.reload());
                                }
                              }}
                            >
                              Terminate
                            </Button>
                          </div>
                        )}
                        {c.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const reason = window.prompt(`Reason for terminating ${c.contract_id}?:`);
                              if (reason !== null) {
                                fetch(`/api/contracts/${c.id}/approve`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "terminated", reason }),
                                }).then(() => window.location.reload());
                              }
                            }}
                          >
                            Terminate
                          </Button>
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
