"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/dashboard-layout";
import { useToastActions } from "@/components/ui/toast";
import { Bell, Plus, FilePlus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const createNotificationSchema = z.object({
  user_id: z.string().min(1, "Select a user"),
  title: z.string().min(1, "Title is required"),
  message: z.string().optional(),
  type: z.enum(["info", "warning", "success", "danger"]).default("info"),
  link: z.string().optional(),
});

type NotificationValues = z.infer<typeof createNotificationSchema>;

export default function NotificationsPage() {
  const { success, error } = useToastActions();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [filterType, setFilterType] = React.useState("all");
  const form = useForm<NotificationValues>({
    resolver: zodResolver(createNotificationSchema) as any,
    defaultValues: { type: "info" },
  });

  React.useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?unread_only=false");
      if (res.ok) {
        const data = await res.json();
        const list = data.notifications || [];
        setNotifications(list);
        setUnreadCount(list.filter((n: any) => !n.is_read).length);
      }
    } catch {
      error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST", body: JSON.stringify({ is_read: true }) });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      error("Failed to mark as read");
    }
  };

  const handleSubmit = async (values: NotificationValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to create notification");
      success("Notification sent");
      form.reset();
      setOpen(false);
      loadNotifications();
    } catch {
      error("Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  const filtered = notifications.filter((n) => filterType === "all" || n.type === filterType);

  return (
    <DashboardLayout role="administrator" userName="Administrator">
      <PageHeader title="Notifications" description="Send and manage notifications to users." />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-red-primary" />
          <h2 className="text-lg font-semibold text-charcoal">Notifications</h2>
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-red-primary text-white text-xs font-bold">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setFilterType("all")} variant={filterType === "all" ? "primary" : "outline"} size="sm">
            All
          </Button>
          <Button onClick={() => setFilterType("info")} variant={filterType === "info" ? "primary" : "outline"} size="sm">
            Info
          </Button>
          <Button onClick={() => setFilterType("warning")} variant={filterType === "warning" ? "primary" : "outline"} size="sm">
            Warning
          </Button>
          <Button onClick={() => setFilterType("success")} variant={filterType === "success" ? "primary" : "outline"} size="sm">
            Success
          </Button>
          <Button onClick={() => setFilterType("danger")} variant={filterType === "danger" ? "primary" : "outline"} size="sm">
            Danger
          </Button>
          <Button onClick={() => setOpen(true)}>
            <FilePlus className="w-4 h-4 mr-2" />
            Send
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Read</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-secondary">
                      No notifications.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium text-charcoal">{n.title}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{n.message || "\u2014"}</TableCell>
                      <TableCell>{<Badge variant={(n.type as any) || "primary"}>{n.type}</Badge>}</TableCell>
                      <TableCell className="text-center">
                        {n.is_read ? (
                          <Badge variant="gray">Read</Badge>
                        ) : (
                          <Badge variant="danger">Unread</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-secondary">{new Date(n.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {!n.is_read && (
                          <Button size="sm" onClick={() => markRead(n.id)}>Mark read</Button>
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
            <CardTitle>Send Notification</CardTitle>
            <Button size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Input label="User ID" id="user_id" placeholder="e.g. 550e8400-e29b..." {...form.register("user_id")} />
            <Input label="Title" id="title" placeholder="Training reminder" {...form.register("title")} />
            <Input label="Message" id="message" placeholder="Optional message" {...form.register("message")} />
            <Input label="Type" id="type" placeholder="info" {...form.register("type")} />
            <Input label="Link (optional)" id="link" placeholder="/admin/players" {...form.register("link")} />
            <Button type="submit" className="w-auto" disabled={loading}>
              Send Notification
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
