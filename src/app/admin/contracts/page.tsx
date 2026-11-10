"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/dashboard-layout";
import { useToastActions } from "@/components/ui/toast";
import { FileText, FilePlus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const contractSchema = z.object({
  player_id: z.string().min(1, "Select a player"),
  contract_type: z.string().min(1, "Contract type is required"),
  commencement_date: z.string().min(1, "Start date required"),
  expiry_date: z.string().min(1, "Expiry date required"),
  agreed_remuneration: z.coerce.number().optional(),
  currency: z.string().default("UGX"),
  payment_frequency: z.string().optional(),
  contract_conditions: z.string().optional(),
});

export default function ContractsPage() {
  const { success, error } = useToastActions();
  const [contracts, setContracts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const form = useForm<z.infer<typeof contractSchema>>({
    resolver: zodResolver(contractSchema) as any,
    defaultValues: { currency: "UGX" },
  });

  React.useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contracts");
      if (res.ok) {
        const data = await res.json();
        setContracts(data.contracts || []);
      }
    } catch {
      error("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: z.infer<typeof contractSchema>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed");
      success("Contract created");
      form.reset();
      setOpen(false);
      loadContracts();
    } catch {
      error("Failed to create contract");
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: "gray",
      "pending approval": "warning",
      "awaiting signature": "info",
      active: "success",
      "renewal pending": "warning",
      expired: "gray",
      terminated: "danger",
    };
    return <Badge variant={(map[status] || "gray") as any}>{status}</Badge>;
  };

  return (
    <DashboardLayout role="administrator" userName="Administrator">
      <PageHeader
        title="Contract Management"
        description="Create and manage player contracts. Track status and expiries."
      />

      <div className="flex gap-2 mb-6">
        <Button onClick={() => setOpen(true)}>
          <FilePlus className="w-4 h-4 mr-2" /> Create Contract
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract Register</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract ID</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Commencement</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Remuneration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-secondary">
                      No contracts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  contracts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">{c.contract_id}</TableCell>
                      <TableCell className="font-medium text-charcoal">{c.player_name}</TableCell>
                      <TableCell className="text-sm">{c.contract_type}</TableCell>
                      <TableCell className="text-sm">{c.commencement_date ? new Date(c.commencement_date).toLocaleDateString() : "\u2014"}</TableCell>
                      <TableCell className="text-sm">{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : "\u2014"}</TableCell>
                      <TableCell className="text-sm">{c.agreed_remuneration ? c.agreed_remuneration.toLocaleString() + " " + c.currency : "\u2014"}</TableCell>
                      <TableCell>{statusBadge(c.status)}</TableCell>
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
        <Card className="relative w-full max-w-lg bg-white p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <CardTitle>Create Contract</CardTitle>
            <Button size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Player ID" id="player_id" placeholder="e.g. OTF-2026-0001" {...form.register("player_id")} />
              <Input label="Contract type" id="contract_type" placeholder="e.g. Professional player agreement" {...form.register("contract_type")} />
              <Input label="Commencement date" type="date" id="commencement_date" {...form.register("commencement_date")} />
              <Input label="Expiry date" type="date" id="expiry_date" {...form.register("expiry_date")} />
              <Input label="Agreed remuneration" type="number" id="agreed_remuneration" {...form.register("agreed_remuneration")} />
              <Input label="Currency" id="currency" defaultValue="UGX" {...form.register("currency")} />
              <Input label="Payment frequency" id="payment_frequency" placeholder="e.g. Monthly" {...form.register("payment_frequency")} />
            </div>
            <Textarea label="Contract conditions" id="contract_conditions" {...form.register("contract_conditions")} />
            <Button type="submit" className="w-auto" disabled={loading}>
              Create Contract
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
