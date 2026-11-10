"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X, Bell, CheckCircle2, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

const TOAST_LIMIT = 5;

type ToastState = {
  toasts: Toast[];
};

let state: ToastState = { toasts: [] };

function notify(toast: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2, 10);
  const newToast: Toast = { ...toast, id };
  state.toasts = [newToast, ...state.toasts].slice(0, TOAST_LIMIT);
  listeners.forEach((l) => l(state.toasts));
  return id;
}

let listeners: Array<(toasts: Toast[]) => void> = [];

export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>(state.toasts);

  React.useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  const toast = (t: Omit<Toast, "id">) => notify(t);
  const dismiss = (id: string) => {
    state.toasts = state.toasts.filter((t) => t.id !== id);
    listeners.forEach((l) => l(state.toasts));
  };

  return { toasts, toast, dismiss };
}

const typeConfig: Record<ToastType, { icon: React.ElementType; color: string; bg: string }> = {
  success: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10 border-success/20" },
  error: { icon: AlertCircle, color: "text-danger", bg: "bg-danger/10 border-danger/20" },
  warning: { icon: Info, color: "text-warning", bg: "bg-warning/10 border-warning/20" },
  info: { icon: Bell, color: "text-red-primary", bg: "bg-red-primary/10 border-red-primary/20" },
};

export function Toast({ id, title, message, type, dismiss }: { id: string; title: string; message?: string; type: ToastType; dismiss: (id: string) => void }) {
  const config = typeConfig[type];
  const Icon = config.icon;
  return (
    <div
      key={id}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-right-2 duration-300",
        config.bg,
        config.color.replace("text-", "border-"),
      )}
    >
      <div className={cn("flex-shrink-0 mt-0.5", config.color)}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-charcoal">{title}</h4>
        {message && <p className="text-sm text-gray-secondary mt-0.5">{message}</p>}
      </div>
      <button
        onClick={() => dismiss(id)}
        className="rounded-md p-1.5 text-gray-secondary hover:bg-gray-light hover:text-charcoal focus:outline-none"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} dismiss={dismiss} />
      ))}
    </div>
  );
}

export function useToastActions() {
  const { toast } = useToast();
  return {
    success: (title: string, message?: string) => toast({ title, message, type: "success" }),
    error: (title: string, message?: string) => toast({ title, message, type: "error" }),
    warning: (title: string, message?: string) => toast({ title, message, type: "warning" }),
    info: (title: string, message?: string) => toast({ title, message, type: "info" }),
  };
}
