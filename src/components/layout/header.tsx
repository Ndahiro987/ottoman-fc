"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, User as UserIcon, LogOut, Shield, Home, ClipboardList, Banknote, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoText } from "@/components/branding/logo";
import { useToastActions } from "@/components/ui/toast";

interface HeaderProps {
  role: "administrator" | "coach" | "player";
  userName: string;
  onDrawerToggle: () => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (v: boolean) => void;
}

const NAV_BY_ROLE: Record<string, { label: string; href: string; icon: React.ElementType }[]> = {
  administrator: [
    { label: "Dashboard", href: "/admin", icon: Home },
    { label: "Players", href: "/admin/players", icon: Shield },
    { label: "Contracts", href: "/admin/contracts", icon: FileTextIcon },
    { label: "Payments", href: "/admin/payments", icon: Banknote },
    { label: "Reports", href: "/admin/reports", icon: Activity },
  ],
  coach: [
    { label: "Dashboard", href: "/coach", icon: Home },
    { label: "Players", href: "/coach/players", icon: Shield },
    { label: "Line-ups", href: "/coach/lineups", icon: Activity },
    { label: "Tactical Board", href: "/coach/tactical", icon: ClipboardList },
    { label: "Matches", href: "/coach/matches", icon: Activity },
  ],
  player: [
    { label: "Dashboard", href: "/player", icon: Home },
    { label: "Profile", href: "/player/profile", icon: UserIcon },
    { label: "Contract", href: "/player/contract", icon: FileTextIcon },
    { label: "Performance", href: "/player/performance", icon: Activity },
  ],
};

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m-6 4v-3m6 3v-4m-6 4h-6m-6-4h6m-6-4V9m6 0h6m-6 0V5m6 0V0m0 0v24m0-24H0m0 24h24" />
    </svg>
  );
}

export function Header({
  role,
  userName,
  onDrawerToggle,
  isDrawerOpen,
  setIsDrawerOpen,
}: HeaderProps) {
  const pathname = usePathname();
  const { error } = useToastActions();
  const quickLinks = NAV_BY_ROLE[role] || NAV_BY_ROLE.player;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      error("Logout failed", "Could not sign out.");
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-gray-light bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onDrawerToggle}
            className="md:hidden p-2 rounded-md text-charcoal hover:bg-gray-light"
            aria-label="Toggle navigation"
          >
            <Shield size={20} />
          </button>
          <Link href={role === "administrator" ? "/admin" : role === "coach" ? "/coach" : "/player"}>
            <LogoText />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-red-primary text-white"
                    : "text-charcoal hover:bg-gray-light hover:text-red-primary"
                )}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            className="p-2 rounded-md text-charcoal hover:bg-gray-light relative"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-primary"></span>
          </button>
          <div className="flex items-center gap-2 pl-4 border-l border-gray-light">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-sm font-medium text-charcoal">{userName}</p>
              <p className="text-xs text-gray-secondary capitalize">{role}</p>
            </div>
            <UserIcon className="w-8 h-8 rounded-full bg-red-primary text-white flex-shrink-0" />
            <button
              onClick={handleLogout}
              className="ml-2 p-2 rounded-md text-charcoal hover:bg-gray-light"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
