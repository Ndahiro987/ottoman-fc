"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToastActions } from "@/components/ui/toast";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const resetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type ResetValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const { success, error } = useToastActions();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { token, password: "", confirm_password: "" },
  });

  const onSubmit = async (values: ResetValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: values.token, password: values.password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error("Failed", data.error || "Could not reset password.");
        return;
      }

      success("Password reset", "Your password has been reset. You can now sign in.");
      setDone(true);
      form.reset();
    } catch {
      error("Failed", "Unable to reach the server. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-light px-4">
        <Card className="w-full max-w-md shadow-lg rounded-2xl border border-gray-light">
          <CardHeader className="text-center space-y-1">
            <Lock className="w-12 h-12 mx-auto text-red-primary mb-4" />
            <CardTitle className="text-2xl font-bold text-charcoal">Invalid Reset Link</CardTitle>
            <CardDescription className="text-gray-secondary">
              No reset token was provided. Please request a new reset link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Link href="/forgot-password">
                <Button>Request Reset Link</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-light px-4">
        <Card className="w-full max-w-md shadow-lg rounded-2xl border border-gray-light">
          <CardHeader className="text-center space-y-1">
            <Lock className="w-12 h-12 mx-auto text-success mb-4" />
            <CardTitle className="text-2xl font-bold text-charcoal">Password Reset</CardTitle>
            <CardDescription className="text-gray-secondary">
              Your password has been reset successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-light px-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl border border-gray-light">
        <CardHeader className="text-center space-y-1">
          <Lock className="w-12 h-12 mx-auto text-red-primary mb-4" />
          <CardTitle className="text-2xl font-bold text-charcoal">Reset Password</CardTitle>
          <CardDescription className="text-gray-secondary">
            Enter your new password below.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="password"
              type="password"
              label="New password"
              placeholder="••••••••"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-danger mt-1">{form.formState.errors.password.message}</p>
            )}
            <Input
              id="confirm_password"
              type="password"
              label="Confirm password"
              placeholder="••••••••"
              {...form.register("confirm_password")}
            />
            {form.formState.errors.confirm_password && (
              <p className="text-xs text-danger mt-1">{form.formState.errors.confirm_password.message}</p>
            )}
            <Button type="submit" className="w-full py-3 text-base" disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="pt-6 border-t border-gray-light">
          <p className="text-center text-xs text-gray-secondary">
            Remember your password?{" "}
            <Link href="/login" className="text-red-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
