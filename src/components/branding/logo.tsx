"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Shield, Trophy, User, Users } from "lucide-react";

interface LogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  title?: string;
}

export function Logo({
  className,
  width = 40,
  height = 40,
  title = "OTTOMAN FC",
}: LogoProps) {
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      title={title}
    >
      <div className={`w-${typeof width === "number" ? width : "auto"} h-${typeof height === "number" ? height : "auto"} rounded-lg bg-red-primary flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
        <Shield size={height === "auto" ? 20 : Math.min(height as number, 24)} />
      </div>
      <span className="font-bold text-red-primary text-xl tracking-tight">
        OTTOMAN
      </span>
      <span className="font-bold text-charcoal text-xl tracking-tight">FC</span>
    </div>
  );
}

export function LogoText() {
  return (
    <div className="flex items-center gap-2">
      <Shield className="w-6 h-6 text-red-primary" />
      <span className="font-bold text-red-primary text-lg tracking-tight">OTTOMAN</span>
      <span className="font-bold text-charcoal text-lg tracking-tight">FC</span>
      <span className="text-xs text-gray-secondary uppercase tracking-widest mt-0.5">CONNECT</span>
    </div>
  );
}

export function BrandIcon({ icon = Shield, className }: { icon?: React.ElementType; className?: string }) {
  const Icon = icon;
  return <Icon className={cn("w-5 h-5 text-red-primary", className)} />;
}
