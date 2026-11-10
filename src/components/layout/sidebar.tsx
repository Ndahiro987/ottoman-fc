"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  User,
  FileText,
  Shield,
  ClipboardList,
  Trophy,
  Calendar,
  Banknote,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  Check,
  Upload,
} from "lucide-react";
import { LogoText } from "@/components/branding/logo";
import { useToastActions } from "@/components/ui/toast";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: ("administrator" | "coach" | "player")[];
}

const ADMIN_ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["administrator"] },
  { label: "Players", href: "/admin/players", icon: Users, roles: ["administrator"] },
  { label: "Approvals", href: "/admin/players/approvals", icon: Check, roles: ["administrator"] },
  { label: "Registrations", href: "/admin/registrations", icon: FileText, roles: ["administrator"] },
  { label: "KYC Documents", href: "/admin/kyc", icon: Shield, roles: ["administrator"] },
  { label: "KYC Review", href: "/admin/kyc/review", icon: FileText, roles: ["administrator"] },
  { label: "KYC Upload", href: "/admin/kyc/upload", icon: Upload, roles: ["administrator"] },
  { label: "Contracts", href: "/admin/contracts/manage", icon: FileText, roles: ["administrator"] },
  { label: "Payments", href: "/admin/payments/approve", icon: Banknote, roles: ["administrator"] },
  { label: "Teams", href: "/admin/teams", icon: Trophy, roles: ["administrator"] },
  { label: "Line-ups", href: "/admin/lineups", icon: Activity, roles: ["administrator"] },
  { label: "Matches", href: "/admin/matches/manage", icon: Calendar, roles: ["administrator"] },
  { label: "Training", href: "/admin/training/manage", icon: ClipboardList, roles: ["administrator"] },
  { label: "Performance", href: "/admin/performance", icon: Activity, roles: ["administrator"] },
  { label: "Tactical Board", href: "/admin/tactical", icon: ClipboardList, roles: ["administrator"] },
  { label: "Reports", href: "/admin/reports", icon: Activity, roles: ["administrator"] },
  { label: "Users", href: "/admin/users", icon: Users, roles: ["administrator"] },
  { label: "Audit Logs", href: "/admin/audit/view", icon: Activity, roles: ["administrator"] },
  { label: "Settings", href: "/admin/settings", icon: Settings, roles: ["administrator"] },
];

const COACH_ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/coach", icon: LayoutDashboard, roles: ["coach"] },
  { label: "Players", href: "/coach/players", icon: Users, roles: ["coach"] },
  { label: "Line-ups", href: "/coach/lineups", icon: Activity, roles: ["coach"] },
  { label: "Tactical Board", href: "/coach/tactical", icon: ClipboardList, roles: ["coach"] },
  { label: "Matches", href: "/coach/matches", icon: Calendar, roles: ["coach"] },
  { label: "Training", href: "/coach/training", icon: ClipboardList, roles: ["coach"] },
  { label: "Performance", href: "/coach/performance", icon: Activity, roles: ["coach"] },
  { label: "Reports", href: "/coach/reports", icon: Activity, roles: ["coach"] },
];

const PLAYER_ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/player", icon: LayoutDashboard, roles: ["player"] },
  { label: "Registration", href: "/player/registration", icon: FileText, roles: ["player"] },
  { label: "Profile", href: "/player/profile", icon: User, roles: ["player"] },
  { label: "Contract", href: "/player/contract", icon: FileText, roles: ["player"] },
  { label: "Payments", href: "/player/payments", icon: Banknote, roles: ["player"] },
  { label: "Performance", href: "/player/performance", icon: Activity, roles: ["player"] },
  { label: "Matches", href: "/player/matches", icon: Calendar, roles: ["player"] },
  { label: "Training", href: "/player/training", icon: ClipboardList, roles: ["player"] },
];

export function Sidebar({ role }: { role: "administrator" | "coach" | "player" }) {
  const pathname = usePathname();
  const items =
    role === "administrator" ? ADMIN_ITEMS : role === "coach" ? COACH_ITEMS : PLAYER_ITEMS;
  const { error } = useToastActions();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } catch {
      error("Logout failed", "Could not sign out. Try again.");
    }
  };

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-64 bg-charcoal text-white transform transition-transform duration-300 -translate-x-full md:translate-x-0 z-40 flex flex-col">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-red-primary" />
            <span className="font-bold text-xl tracking-tight text-red-primary">OTTOMAN</span>
            <span className="font-bold text-xl tracking-tight text-white">FC</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">CONNECT</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-red-primary/20 text-red-300 border-l-2 border-red-primary"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="fixed left-0 top-0 z-30 md:hidden p-3">
        <button
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-charcoal text-white border border-white/10 hover:bg-white/10"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>
    </>
  );
}

export function MobileDrawer({
  role,
  isOpen,
  onClose,
}: {
  role: "administrator" | "coach" | "player";
  isOpen: boolean;
  onClose: () => void;
}) {
  const items =
    role === "administrator" ? ADMIN_ITEMS : role === "coach" ? COACH_ITEMS : PLAYER_ITEMS;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-charcoal/95 backdrop-blur flex flex-col transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-primary" />
          <span className="font-bold text-lg text-red-primary">OTTOMAN FC</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                "text-gray-300 hover:bg-white/10 hover:text-white block"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => {
            onClose();
            fetch("/api/auth/logout", { method: "POST" }).then(() => {
              window.location.href = "/login";
            });
          }}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-white/90 bg-white/5 hover:bg-white/10"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </div>
  );
}
