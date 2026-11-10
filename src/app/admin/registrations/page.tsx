"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/dashboard-layout";
import { useToastActions } from "@/components/ui/toast";
import { UserPlus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const registerSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  national_id: z.string().optional(),
  passport_number: z.string().optional(),
  phone: z.string().optional(),
  alternative_phone: z.string().optional(),
  email: z.string().email().optional(),
  residential_address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_number: z.string().optional(),
  primary_position: z.string().optional(),
  secondary_position: z.string().optional(),
  preferred_foot: z.string().optional(),
  jersey_number: z.coerce.number().optional(),
  previous_club: z.string().optional(),
  football_experience: z.string().optional(),
  player_category: z.string().optional(),
});

type RegisterValues = z.infer<typeof registerSchema>;

const statusBadge = (status: string) => {
  const map: Record<string, "primary" | "success" | "warning" | "danger" | "gray"> = {
    pending: "warning",
    active: "success",
    rejected: "danger",
    inactive: "gray",
  };
  return <Badge variant={(map[status] || "gray") as any}>{status}</Badge>;
};

export default function RegistrationsPage() {
  const { success, error } = useToastActions();
  const [players, setPlayers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [selectedPlayer, setSelectedPlayer] = React.useState<{ id: string; full_name: string } | null>(null);
  const [approveLoading, setApproveLoading] = React.useState<Record<string, boolean>>({});

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: { full_name: "" },
  });

  React.useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/players?status=pending");
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players || []);
      }
    } catch {
      error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: RegisterValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Registration failed");
      success("Player registered", "Awaiting administrator approval.");
      form.reset();
      setOpen(false);
      loadPlayers();
    } catch {
      error("Failed to register player");
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id: string, status: "approved" | "rejected") => {
    setApproveLoading({ ...approveLoading, [id]: true });
    try {
      const res = await fetch(`/api/players/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      success(status === "approved" ? "Registration approved" : "Registration rejected");
      loadPlayers();
    } catch {
      error("Failed to update registration");
    } finally {
      setApproveLoading({ ...approveLoading, [id]: false });
    }
  };

  return (
    <DashboardLayout role="administrator" userName="Administrator">
      <PageHeader
        title="Player Registrations"
        description="Review and approve new player registrations. Only administrators can approve registrations."
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-red-primary" />
          <h2 className="text-lg font-semibold text-charcoal">Pending Registrations</h2>
        </div>
        <Button onClick={() => setOpen(true)}>Register Player</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-secondary">
                      No pending registrations.
                    </TableCell>
                  </TableRow>
                ) : (
                  players.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.player_id}</TableCell>
                      <TableCell className="font-medium text-charcoal">{p.full_name}</TableCell>
                      <TableCell className="text-sm">{p.primary_position || "\u2014"}</TableCell>
                      <TableCell className="text-sm">{p.player_category || "\u2014"}</TableCell>
                      <TableCell className="text-sm">{p.phone || "\u2014"}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => { setSelectedPlayer({ id: p.id, full_name: p.full_name }); setOpen(true); }} disabled={approveLoading[p.id]}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDecision(p.id, "rejected")} disabled={approveLoading[p.id]}>
                            Reject
                          </Button>
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

      <div className={`fixed inset-0 z-50 flex items-center justify-center ${open ? "visible" : "hidden"}`}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <Card className="relative w-full max-w-2xl bg-white p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <CardTitle>Register New Player</CardTitle>
            <Button size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
          <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full legal name" id="full_name" placeholder="John Doe" {...form.register("full_name")} />
              <Input label="Date of birth" type="date" id="date_of_birth" {...form.register("date_of_birth")} />
              <Input label="Nationality" id="nationality" {...form.register("nationality")} />
              <Input label="Phone" id="phone" {...form.register("phone")} />
              <Input label="Email" type="email" id="email" {...form.register("email")} />
              <Input label="Primary position" id="primary_position" placeholder="e.g. Right Back" {...form.register("primary_position")} />
              <Input label="Jersey number" type="number" id="jersey_number" {...form.register("jersey_number")} />
              <Input label="Player category" id="player_category" placeholder="e.g. Senior team" {...form.register("player_category")} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Emergency contact name" id="emergency_contact_name" {...form.register("emergency_contact_name")} />
              <Input label="Emergency contact number" id="emergency_contact_number" {...form.register("emergency_contact_number")} />
            </div>
            <Button type="submit" className="w-auto" disabled={loading}>
              Register Player
            </Button>
          </form>
        </Card>
      </div>

      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedPlayer(null)} />
          <Card className="relative w-full max-w-md bg-white p-6 shadow-2xl">
            <CardHeader>
              <CardTitle>Review Registration</CardTitle>
              <CardDescription>Reviewing: <span className="font-medium">{selectedPlayer.full_name}</span></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-secondary">
                Approving this registration will activate the player and create their account access.
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedPlayer(null)}>Cancel</Button>
              <Button onClick={() => handleDecision(selectedPlayer.id, "approved")} disabled={approveLoading[selectedPlayer.id]}>
                Approve
              </Button>
              <Button variant="outline" onClick={() => handleDecision(selectedPlayer.id, "rejected")} disabled={approveLoading[selectedPlayer.id]}>
                Reject
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
