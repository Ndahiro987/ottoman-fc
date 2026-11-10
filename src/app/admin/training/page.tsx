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
import { ClipboardList, FilePlus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const trainingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  session_type: z.string().optional(),
  session_date: z.string().min(1, "Session date is required"),
  venue: z.string().optional(),
  responsible_coach: z.string().optional(),
  description: z.string().optional(),
});

type TrainingValues = z.infer<typeof trainingSchema>;

export default function TrainingPage() {
  const { success, error } = useToastActions();
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const form = useForm<TrainingValues>({
    resolver: zodResolver(trainingSchema) as any,
    defaultValues: {},
  });

  React.useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/training-sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.training_sessions || []);
      }
    } catch {
      error("Failed to load training sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: TrainingValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/training-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to create training session");
      success("Training session created");
      form.reset();
      setOpen(false);
      loadSessions();
    } catch {
      error("Failed to create training session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="administrator" userName="Administrator">
      <PageHeader title="Training Sessions" description="Schedule and track team training sessions." />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-red-primary" />
          <h2 className="text-lg font-semibold text-charcoal">Training Schedule</h2>
        </div>
        <Button onClick={() => setOpen(true)}>
          <FilePlus className="w-4 h-4 mr-2" />
          Add Session
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Responsible Coach</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-secondary">
                      No training sessions scheduled.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-charcoal">{s.title}</TableCell>
                      <TableCell className="text-sm">{s.session_type || "\u2014"}</TableCell>
                      <TableCell className="text-sm">{new Date(s.session_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">{s.venue || "\u2014"}</TableCell>
                      <TableCell className="text-sm">{s.responsible_coach || "\u2014"}</TableCell>
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
            <CardTitle>Add Training Session</CardTitle>
            <Button size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Input label="Session title" id="title" placeholder="e.g. Tactical drills" {...form.register("title")} />
            <Input label="Session type" id="session_type" placeholder="e.g. Endurance, Tactics" {...form.register("session_type")} />
            <Input label="Session date" type="datetime-local" id="session_date" {...form.register("session_date")} />
            <Input label="Venue" id="venue" placeholder="e.g. Training ground" {...form.register("venue")} />
            <Input label="Responsible coach" id="responsible_coach" placeholder="Coach name" {...form.register("responsible_coach")} />
            <Input label="Description" id="description" {...form.register("description")} />
            <Button type="submit" className="w-auto" disabled={loading}>
              Create Session
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
