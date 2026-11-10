import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { DashboardLayout, PageHeader } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

async function getMatches() {
  const result = await db.query(
    `SELECT id, opponent, competition, match_date, venue, home_or_away,
            home_score, away_score, status, coach_comments, created_at
     FROM matches
     ORDER BY match_date DESC`
  );
  return result.rows;
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    scheduled: "gray",
    postponed: "primary",
    cancelled: "danger",
    completed: "success",
  };
  return <Badge variant={(map[status] || "gray") as "success" | "warning" | "gray" | "danger" | "primary"}>{status}</Badge>;
};

export default async function MatchesManagePage() {
  try {
    await requireDatabase();
  } catch {
    redirect("/database-unavailable");
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "administrator" && user.role !== "coach") redirect("/login?error=access_denied");

  let matches;
  try {
    matches = await getMatches();
  } catch {
    matches = [];
  }

  return (
    <DashboardLayout role={user.role} userName={user.first_name || user.username}>
      <PageHeader
        title="Match Management"
        description="Schedule matches and record results and scores."
      />

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Matches</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-charcoal">{matches.length}</p>
            <p className="text-sm text-gray-secondary">matches on file</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-success">{matches.filter((m) => m.status === "completed").length}</p>
            <p className="text-sm text-gray-secondary">matches played</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-warning">{matches.filter((m) => m.status === "scheduled").length}</p>
            <p className="text-sm text-gray-secondary">matches scheduled</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <Button onClick={() => {
          const opponent = window.prompt("Opponent team:");
          if (!opponent) return;
          const competition = window.prompt("Competition (optional):");
          const matchDate = window.prompt("Match date (YYYY-MM-DD):");
          if (!matchDate) return;
          const venue = window.prompt("Venue (optional):");
          const homeOrAway = window.prompt("Home or Away? (home/away/neutral):", "home");
          if (!homeOrAway) return;
          
          fetch("/api/matches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              opponent,
              competition: competition || null,
              match_date: matchDate,
              venue: venue || null,
              home_or_away: homeOrAway,
              status: "scheduled",
            }),
          }).then(() => window.location.reload());
        }}
      >
        <Calendar className="w-4 h-4 mr-2" /> Schedule Match
      </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Matches</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opponent</TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Home/Away</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-secondary">
                      No matches found.
                    </TableCell>
                  </TableRow>
                ) : (
                  matches.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-charcoal">{m.opponent}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{m.competition || "\u2014"}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{m.match_date}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{m.venue || "\u2014"}</TableCell>
                      <TableCell className="text-sm capitalize">{m.home_or_away}</TableCell>
                      <TableCell className="text-sm font-mono text-charcoal">
                        {m.status === "completed" && m.home_score !== null && m.away_score !== null
                          ? `${m.home_score} - ${m.away_score}`
                          : "\u2014"}
                      </TableCell>
                      <TableCell>{statusBadge(m.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const homeScore = window.prompt("Home score:");
                              if (homeScore === null) return;
                              const awayScore = window.prompt("Away score:");
                              if (awayScore === null) return;
                              const status = window.prompt("Status (scheduled/postponed/cancelled/completed):", "completed");
                              if (!status) return;
                              
                              fetch(`/api/matches/${m.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  home_score: Number(homeScore),
                                  away_score: Number(awayScore),
                                  status,
                                }),
                              }).then(() => window.location.reload());
                            }}
                          >
                            Edit Score
                          </Button>
                          {m.status === "completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const comments = window.prompt("Coach comments (optional):");
                                fetch(`/api/matches/${m.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ coach_comments: comments || null }),
                                }).then(() => window.location.reload());
                              }}
                            >
                              Notes
                            </Button>
                          )}
                        </div>
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
