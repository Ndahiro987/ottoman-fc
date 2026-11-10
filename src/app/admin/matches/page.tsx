"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/dashboard-layout";
import { useToastActions } from "@/components/ui/toast";
import { Calendar, FilePlus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const matchSchema = z.object({
  opponent: z.string().min(1, "Opponent is required"),
  competition: z.string().optional(),
  match_date: z.string().min(1, "Match date is required"),
  venue: z.string().optional(),
  home_or_away: z.enum(["home", "away", "neutral"]).default("home"),
  home_score: z.coerce.number().int().nonnegative().optional(),
  away_score: z.coerce.number().int().nonnegative().optional(),
  status: z.enum(["scheduled", "postponed", "cancelled", "completed"]).default("scheduled"),
  coach_comments: z.string().optional(),
});

type MatchValues = z.infer<typeof matchSchema>;

const statusBadge = (status: string) => {
  const map: Record<string, "primary" | "success" | "warning" | "danger" | "gray"> = {
    scheduled: "primary",
    completed: "success",
    postponed: "warning",
    cancelled: "danger",
    neutral: "gray",
  };
  return <Badge variant={(map[status] || "gray") as any}>{status}</Badge>;
};

export default function MatchesPage() {
  const { success, error } = useToastActions();
  const [matches, setMatches] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const form = useForm<MatchValues>({
    resolver: zodResolver(matchSchema) as any,
    defaultValues: { home_or_away: "home", status: "scheduled" },
  });

  React.useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/matches");
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
      }
    } catch {
      error("Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: MatchValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to create match");
      success("Match created");
      form.reset();
      setOpen(false);
      loadMatches();
    } catch {
      error("Failed to create match");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="administrator" userName="Administrator">
      <PageHeader title="Matches" description="Manage club fixtures and match records." />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-red-primary" />
          <h2 className="text-lg font-semibold text-charcoal">Fixtures</h2>
        </div>
        <Button onClick={() => setOpen(true)}>
          <FilePlus className="w-4 h-4 mr-2" />
          Add Match
        </Button>
      </div>

      <Card>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-secondary">
                      No matches scheduled.
                    </TableCell>
                  </TableRow>
                ) : (
                  matches.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-charcoal">{m.opponent}</TableCell>
                      <TableCell className="text-sm">{m.competition || "\u2014"}</TableCell>
                      <TableCell className="text-sm">{new Date(m.match_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">{m.venue || "\u2014"}</TableCell>
                      <TableCell className="text-sm text-capitalize">{m.home_or_away}</TableCell>
                      <TableCell className="text-sm font-mono">
                        {m.home_score != null && m.away_score != null ? `${m.home_score} - ${m.away_score}` : "\u2014"}
                      </TableCell>
                      <TableCell>{statusBadge(m.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className={`fixed inset-0 z-50 flex items-center justify-center ${open ? "visible" : "hidden"}`}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <Card className="relative w-full max-w-md bg-white p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <CardTitle>Add Match</CardTitle>
            <Button size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Input label="Opponent" id="opponent" placeholder="e.g. KCCA FC" {...form.register("opponent")} />
            <Input label="Competition" id="competition" placeholder="e.g. Uganda Premier League" {...form.register("competition")} />
            <Input label="Match date" type="datetime-local" id="match_date" {...form.register("match_date")} />
            <Input label="Venue" id="venue" placeholder="e.g. Mandela National Stadium" {...form.register("venue")} />
            <Input
              label="Home or Away"
              id="home_or_away"
              placeholder="home"
              {...form.register("home_or_away")}
            />
            <Input label="Home score" type="number" id="home_score" {...form.register("home_score")} />
            <Input label="Away score" type="number" id="away_score" {...form.register("away_score")} />
            <Input
              label="Status"
              id="status"
              placeholder="scheduled"
              {...form.register("status")}
            />
            <Input label="Coach comments" id="coach_comments" {...form.register("coach_comments")} />
            <Button type="submit" className="w-auto" disabled={loading}>
              Create Match
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
