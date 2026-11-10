"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-charcoal mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "block w-full rounded-md border border-gray-light bg-white px-3 py-2 text-sm text-charcoal shadow-sm placeholder:text-gray-secondary focus:border-red-primary focus:ring-1 focus:ring-red-primary focus:outline-none disabled:bg-gray-light disabled:text-gray-secondary",
          error && "border-danger focus:ring-danger",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ className, label, error, id, ...props }: TextareaProps) {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-charcoal mb-1"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          "block w-full rounded-md border border-gray-light bg-white px-3 py-2 text-sm text-charcoal shadow-sm placeholder:text-gray-secondary focus:border-red-primary focus:ring-1 focus:ring-red-primary focus:outline-none disabled:bg-gray-light disabled:text-gray-secondary",
          error && "border-danger focus:ring-danger",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
