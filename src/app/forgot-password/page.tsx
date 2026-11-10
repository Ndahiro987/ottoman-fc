"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToastActions } from "@/components/ui/toast";
import { Mail, Lock } from "lucide-react";
import Link from "next/link";

const forgotSchema = z.object({
  email: z.string().email("Valid email is required"),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const { success, error } = useToastActions();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error("Failed", data.error || "Could not process request.");
        return;
      }

      success("Reset link sent", "Check your email for password reset instructions.");
      setSent(true);
      form.reset();
    } catch {
      error("Failed", "Unable to reach the server. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-light px-4">
        <Card className="w-full max-w-md shadow-lg rounded-2xl border border-gray-light">
          <CardHeader className="text-center space-y-1">
            <Lock className="w-12 h-12 mx-auto text-red-primary mb-4" />
            <CardTitle className="text-2xl font-bold text-charcoal">Check your email</CardTitle>
            <CardDescription className="text-gray-secondary">
              A password reset link has been sent to {form.getValues("email")}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-secondary">
              If you don't see the email, check your spam folder or try again.
            </p>
          </CardContent>
          <CardFooter className="pt-6 border-t border-gray-light">
            <Button className="w-full" onClick={() => setSent(false)}>
              Send another
            </Button>
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-light px-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl border border-gray-light">
        <CardHeader className="text-center space-y-1">
          <Lock className="w-12 h-12 mx-auto text-red-primary mb-4" />
          <CardTitle className="text-2xl font-bold text-charcoal">Forgot Password</CardTitle>
          <CardDescription className="text-gray-secondary">
            Enter your email and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Email address"
              placeholder="name@ottomanfc.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-danger mt-1">{form.formState.errors.email.message}</p>
            )}
            <Button type="submit" className="w-full py-3 text-base" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Reset Link"}
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
