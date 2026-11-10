"use client";

import * as React from "react";
import { Sidebar, MobileDrawer } from "./sidebar";
import { Header } from "./header";
import { ToastContainer } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  LayoutDashboard,
  Users,
  Clock,
  Activity,
  ClipboardList,
  FileText,
  Banknote,
  Calendar,
  AlertTriangle,
  Shield,
} from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  layoutDashboard: LayoutDashboard,
  users: Users,
  user: Users,
  clock: Clock,
  activity: Activity,
  clipboardList: ClipboardList,
  fileText: FileText,
  banknote: Banknote,
  calendar: Calendar,
  alertTriangle: AlertTriangle,
  shield: Shield,
};

interface DashboardLayoutProps {
  role: "administrator" | "coach" | "player";
  userName: string;
  children: React.ReactNode;
}

export function DashboardLayout({
  role,
  userName,
  children,
}: DashboardLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-bg-light">
      <ToastContainer />
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col overflow-hidden md:pl-64">
        <Header
          role={role}
          userName={userName}
          onDrawerToggle={() => setIsDrawerOpen((p) => !p)}
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
        />
        <main className="flex-1 overflow-y-auto bg-bg-light p-4 md:p-6">{children}</main>
      </div>
      <MobileDrawer
        role={role}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-charcoal tracking-tight">{title}</h1>
      {description && <p className="text-gray-secondary mt-1">{description}</p>}
    </div>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: { label: string; positive: boolean };
}) {
  const Icon = ICONS[icon] || LayoutDashboard;
  return (
    <Card className="border-gray-light bg-white p-5 rounded-xl shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-secondary">{title}</p>
          <p className="text-2xl font-bold text-charcoal">{value}</p>
          {subtitle && <p className="text-xs text-gray-secondary">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg bg-red-primary/10 flex items-center justify-center text-red-primary">
          <Icon size={20} />
        </div>
      </div>
      {trend && (
        <p className={`mt-2 text-xs font-medium ${trend.positive ? "text-success" : "text-danger"}`}>
          {trend.positive ? "▲" : "▼"} {trend.label}
        </p>
      )}
    </Card>
  );
}
