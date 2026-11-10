import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { DashboardLayout, PageHeader } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Shield, User, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

async function getPlayerStatus(userId: string) {
  const result = await db.query(
    `SELECT p.id, p.player_id, p.full_name, p.status, p.kyc_status, p.date_of_birth,
            p.gender, p.nationality, p.national_id, p.passport_number, p.phone, p.email,
            p.primary_position, p.player_category, p.photograph_url, p.created_at, p.updated_at
     FROM players p
     WHERE p.user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

async function getPlayerDocuments(playerId: string) {
  const result = await db.query(
    `SELECT id, document_type, file_name, file_url, verification_status, upload_date, rejection_reason
     FROM player_documents
     WHERE player_id = $1
     ORDER BY upload_date DESC`,
    [playerId]
  );
  return result.rows;
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "warning",
    active: "success",
    rejected: "danger",
    inactive: "gray",
  };
  return <Badge variant={(map[status] || "gray") as "success" | "warning" | "gray" | "danger" | "primary"}>{status}</Badge>;
};

const kycBadge = (status: string) => {
  const map: Record<string, string> = {
    not_submitted: "gray",
    pending: "warning",
    approved: "success",
    rejected: "danger",
    requires_resubmission: "primary",
  };
  return <Badge variant={(map[status] || "gray") as "success" | "warning" | "gray" | "danger" | "primary"}>{status}</Badge>;
};

export default async function PlayerRegistrationPage() {
  try {
    await requireDatabase();
  } catch {
    redirect("/database-unavailable");
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "player") redirect("/login?error=access_denied");

  let player;
  let documents;
  try {
    player = await getPlayerStatus(user.id);
    documents = player ? await getPlayerDocuments(player.id) : [];
  } catch {
    player = null;
    documents = [];
  }

  if (!player) {
    return (
      <DashboardLayout role={user.role} userName={user.first_name || user.username}>
        <PageHeader
          title="Registration Status"
          description="View your player registration status."
        />
        <Card>
          <CardHeader>
            <CardTitle>No Registration Found</CardTitle>
            <CardDescription>No player registration is linked to your account.</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-sm text-gray-secondary">
              Please register as a player first.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={user.role} userName={user.first_name || user.username}>
      <PageHeader
        title="Registration Status"
        description="Track your player registration and document verification progress."
      />

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Registration Status</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-gray-secondary" />
              <div>
                <p className="text-sm font-medium text-charcoal">{player.status}</p>
                <p className="text-xs text-gray-secondary">
                  {player.status === "active"
                    ? "Your account is active. You can sign in."
                    : player.status === "rejected"
                    ? "Your registration was rejected. Please contact the administrator."
                    : "Awaiting administrator approval."}
                </p>
              </div>
            </div>
            <div className="mt-3">
              {statusBadge(player.status)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>KYC Status</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-gray-secondary" />
              <div>
                <p className="text-sm font-medium text-charcoal">{player.kyc_status}</p>
                <p className="text-xs text-gray-secondary">
                  {player.kyc_status === "approved"
                    ? "Your documents have been verified."
                    : player.kyc_status === "rejected"
                    ? "Your documents were rejected. Please re-upload."
                    : player.kyc_status === "requires_resubmission"
                    ? "Please resubmit your documents."
                    : "Documents not yet submitted or under review."}
                </p>
              </div>
            </div>
            <div className="mt-3">
              {kycBadge(player.kyc_status)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Player ID</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-gray-secondary" />
              <div>
                <p className="text-sm font-mono font-bold text-charcoal">{player.player_id}</p>
                <p className="text-xs text-gray-secondary">Your unique player identifier</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Player Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-charcoal">Full Name</TableCell>
                  <TableCell>{player.full_name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-charcoal">Date of Birth</TableCell>
                  <TableCell>{player.date_of_birth || "\u2014"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-charcoal">Gender</TableCell>
                  <TableCell>{player.gender || "\u2014"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-charcoal">Nationality</TableCell>
                  <TableCell>{player.nationality || "\u2014"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-charcoal">National ID</TableCell>
                  <TableCell className="font-mono text-sm">{player.national_id}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-charcoal">Passport Number</TableCell>
                  <TableCell>{player.passport_number || "\u2014"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-charcoal">Phone</TableCell>
                  <TableCell>{player.phone || "\u2014"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-charcoal">Email</TableCell>
                  <TableCell>{player.email || "\u2014"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-charcoal">Primary Position</TableCell>
                  <TableCell>{player.primary_position || "\u2014"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-charcoal">Player Category</TableCell>
                  <TableCell>{player.player_category || "\u2014"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-charcoal">Registered On</TableCell>
                  <TableCell className="text-sm text-gray-secondary">
                    {player.created_at ? new Date(player.created_at).toLocaleDateString() : "\u2014"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {documents.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Type</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-charcoal capitalize">{d.document_type}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{d.file_name}</TableCell>
                      <TableCell>{kycBadge(d.verification_status)}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">
                        {d.upload_date ? new Date(d.upload_date).toLocaleDateString() : "\u2014"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {player.status === "rejected" && (
        <Card className="mt-6 border border-red-100 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Registration Rejected</p>
                <p className="text-sm text-red-700 mt-1">
                  Your registration has been rejected by an administrator. Please contact the club for more details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
