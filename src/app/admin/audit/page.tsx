"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/dashboard-layout";
import { useToastActions } from "@/components/ui/toast";
import { Activity } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function AuditPage() {
  const { error } = useToastActions();
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit-logs?limit=100");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.audit_logs || []);
      }
    } catch {
      error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const actionBadge = (action: string) => {
    const map: Record<string, "primary" | "success" | "warning" | "danger" | "gray"> = {
      PLAYER_REGISTRATION_REJECTED: "danger",
      KYC_REVIEW: "warning",
      PAYMENT_APPROVED: "success",
      PAYMENT_REJECTED: "danger",
      MATCH_CREATED: "primary",
      TRAINING_SESSION_CREATED: "primary",
      NOTIFICATION_CREATED: "primary",
    };
    return <Badge variant={(map[action] || "gray") as any}>{action}</Badge>;
  };

  return (
    <DashboardLayout role="administrator" userName="Administrator">
      <PageHeader title="Audit Logs" description="System activity and change history." />

      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-red-primary" />
        <h2 className="text-lg font-semibold text-charcoal">Activity Log</h2>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-secondary">
                      No audit logs available.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{actionBadge(l.action)}</TableCell>
                      <TableCell className="text-sm capitalize">{l.entity_type || "\u2014"}</TableCell>
                      <TableCell className="text-sm font-mono text-gray-secondary">{l.entity_id || "\u2014"}</TableCell>
                      <TableCell className="text-sm">{l.user_name || "\u2014"}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{new Date(l.created_at).toLocaleString()}</TableCell>
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
