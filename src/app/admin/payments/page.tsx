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
import { Banknote, FilePlus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const paymentSchema = z.object({
  player_id: z.string().min(1, "Select a player"),
  payment_category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive(),
  currency: z.string().default("UGX"),
  payment_description: z.string().optional(),
  supporting_evidence: z.string().optional(),
});

export default function PaymentsPage() {
  const { success, error } = useToastActions();
  const [requests, setRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: { currency: "UGX" },
  });

  React.useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch {
      error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: z.infer<typeof paymentSchema>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed");
      success("Payment request created");
      form.reset();
      setOpen(false);
      loadRequests();
    } catch {
      error("Failed to create payment request");
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/payment-requests/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      success(`Payment ${status}`);
      loadRequests();
    } catch {
      error("Failed to process payment");
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
    };
    return <Badge variant={(map[status] || "gray") as any}>{status}</Badge>;
  };

  return (
    <DashboardLayout role="administrator" userName="Administrator">
      <PageHeader
        title="Facilitation & Payments"
        description="Create payment requests and approve or reject them. Approved requests await payment confirmation."
      />

      <div className="flex gap-2 mb-6">
        <Button onClick={() => setOpen(true)}>
          <FilePlus className="w-4 h-4 mr-2" /> New Payment Request
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-light p-4 shadow-sm">
          <p className="text-xs text-gray-secondary">Pending</p>
          <p className="text-xl font-bold text-charcoal">{requests.filter((r) => r.approval_status === "pending").length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-light p-4 shadow-sm">
          <p className="text-xs text-gray-secondary">Approved</p>
          <p className="text-xl font-bold text-charcoal">{requests.filter((r) => r.approval_status === "approved").length}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-secondary">
                      No payment requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.request_number}</TableCell>
                      <TableCell className="font-medium text-charcoal">{r.player_name}</TableCell>
                      <TableCell className="text-sm">{r.payment_category}</TableCell>
                      <TableCell className="text-sm">{r.amount.toLocaleString()} {r.currency}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{new Date(r.requested_date).toLocaleDateString()}</TableCell>
                      <TableCell>{statusBadge(r.approval_status)}</TableCell>
                      <TableCell>
                        {r.approval_status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleDecision(r.id, "approved")}>Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => handleDecision(r.id, "rejected")}>Reject</Button>
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

      <div className={`fixed inset-0 z-50 flex items-center justify-center ${open ? "visible" : "hidden"}`}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <Card className="relative w-full max-w-md bg-white p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <CardTitle>New Payment Request</CardTitle>
            <Button size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Player ID" id="player_id" placeholder="e.g. OTF-2026-0001" {...form.register("player_id")} />
              <Input label="Payment category" id="payment_category" placeholder="e.g. Monthly remuneration" {...form.register("payment_category")} />
              <Input label="Amount" type="number" id="amount" {...form.register("amount")} />
              <Input label="Currency" id="currency" defaultValue="UGX" {...form.register("currency")} />
            </div>
            <Input label="Description" id="payment_description" {...form.register("payment_description")} />
            <Input label="Supporting evidence (ref)" id="supporting_evidence" {...form.register("supporting_evidence")} />
            <Button type="submit" className="w-auto" disabled={loading}>
              Create Request
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
