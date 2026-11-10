import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { DashboardLayout, PageHeader } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X } from "lucide-react";

export const dynamic = "force-dynamic";

async function getPendingPlayers() {
  const result = await db.query(
    `SELECT p.id, p.player_id, p.full_name, p.email, p.phone, p.status, p.kyc_status,
            p.primary_position, p.player_category, p.created_at
     FROM players p
     WHERE p.status = 'pending'
     ORDER BY p.created_at ASC`
  );
  return result.rows;
}

async function getAllPlayers() {
  const result = await db.query(
    `SELECT p.id, p.player_id, p.full_name, p.email, p.status, p.kyc_status, p.created_at
     FROM players p
     ORDER BY p.created_at DESC`
  );
  return result.rows;
}

export default async function PlayersApprovalsPage() {
  try {
    await requireDatabase();
  } catch {
    redirect("/database-unavailable");
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "administrator") redirect("/login?error=access_denied");

  let pendingPlayers;
  let allPlayers;
  try {
    pendingPlayers = await getPendingPlayers();
    allPlayers = await getAllPlayers();
  } catch {
    pendingPlayers = [];
    allPlayers = [];
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "warning",
      active: "success",
      injured: "gray",
      suspended: "danger",
      "on trial": "primary",
      inactive: "gray",
      released: "gray",
    };
    return <Badge variant={(map[status] || "gray") as "success" | "warning" | "gray" | "danger" | "primary"}>{status}</Badge>;
  };

  return (
    <DashboardLayout role={user.role} userName={user.first_name || user.username}>
      <PageHeader
        title="Player Approvals"
        description="Review and approve or reject pending player registrations."
      />

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-charcoal">{pendingPlayers.length}</p>
            <p className="text-sm text-gray-secondary">players awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Players</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-charcoal">{allPlayers.length}</p>
            <p className="text-sm text-gray-secondary">registered players</p>
          </CardContent>
        </Card>
      </div>

      {pendingPlayers.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pending Registrations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPlayers.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.player_id}</TableCell>
                      <TableCell className="font-medium text-charcoal">{p.full_name}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{p.email || "\u2014"}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{p.phone || "\u2014"}</TableCell>
                      <TableCell className="text-sm">{p.primary_position || "\u2014"}</TableCell>
                      <TableCell className="text-sm">{p.player_category || "\u2014"}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : "\u2014"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Approve ${p.full_name}?`)) {
                                fetch(`/api/players/${p.id}/approve`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "approved" }),
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
                              const reason = window.prompt(`Reason for rejecting ${p.full_name}?:`);
                              if (reason !== null) {
                                fetch(`/api/players/${p.id}/approve`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "rejected", reason }),
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
          <CardTitle>All Players</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPlayers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-secondary">
                      No players found.
                    </TableCell>
                  </TableRow>
                ) : (
                  allPlayers.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.player_id}</TableCell>
                      <TableCell className="font-medium text-charcoal">{p.full_name}</TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell>
                        <Badge variant={p.kyc_status === "approved" ? "success" : "warning"}>
                          {p.kyc_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-secondary">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : "\u2014"}
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
