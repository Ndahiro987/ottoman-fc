import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { DashboardLayout, PageHeader } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

async function getTrainingSessions() {
  const result = await db.query(
    `SELECT id, title, session_type, session_date, venue, responsible_coach,
            description, squad_ids, created_at
     FROM training_sessions
     ORDER BY session_date DESC`
  );
  return result.rows;
}

export default async function TrainingSessionsPage() {
  try {
    await requireDatabase();
  } catch {
    redirect("/database-unavailable");
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "administrator" && user.role !== "coach") redirect("/login?error=access_denied");

  let sessions;
  try {
    sessions = await getTrainingSessions();
  } catch {
    sessions = [];
  }

  return (
    <DashboardLayout role={user.role} userName={user.first_name || user.username}>
      <PageHeader
        title="Training Sessions"
        description="Schedule and manage team training sessions."
      />

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Sessions</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-charcoal">{sessions.length}</p>
            <p className="text-sm text-gray-secondary">training sessions on file</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-warning">{sessions.filter((s) => new Date(s.session_date) > new Date()).length}</p>
            <p className="text-sm text-gray-secondary">sessions ahead</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-success">{sessions.filter((s) => new Date(s.session_date) <= new Date()).length}</p>
            <p className="text-sm text-gray-secondary">past sessions</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <Button onClick={() => {
          const title = window.prompt("Session title:");
          if (!title) return;
          const sessionType = window.prompt("Session type (e.g. Tactical, Fitness, Technical):");
          const sessionDate = window.prompt("Session date (YYYY-MM-DD):");
          if (!sessionDate) return;
          const venue = window.prompt("Venue (optional):");
          const responsibleCoach = window.prompt("Responsible coach (optional):");
          const description = window.prompt("Description (optional):");
          
          fetch("/api/training-sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              session_type: sessionType || null,
              session_date: sessionDate,
              venue: venue || null,
              responsible_coach: responsibleCoach || null,
              description: description || null,
            }),
          }).then(() => window.location.reload());
        }}
      >
        <ClipboardList className="w-4 h-4 mr-2" /> Schedule Session
      </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Coach</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-secondary">
                      No training sessions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-charcoal">{s.title}</TableCell>
                      <TableCell className="text-sm capitalize text-gray-secondary">{s.session_type || "\u2014"}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{s.session_date}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{s.venue || "\u2014"}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{s.responsible_coach || "\u2014"}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{s.description || "\u2014"}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString() : "\u2014"}
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
