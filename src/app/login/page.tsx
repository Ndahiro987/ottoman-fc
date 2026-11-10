"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/branding/logo";
import { useToastActions } from "@/components/ui/toast";
import { Lock, User as UserIcon } from "lucide-react";
import { ToastContainer } from "@/components/ui/toast";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const callbackUrl = "/dashboard";
  const { error: toastError, success } = useToastActions();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/setup-status", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && !data.setupComplete) {
          router.push("/setup");
          router.refresh();
        }
      } catch {
        // Ignore; login form still works if DB is reachable
      } finally {
        cancelled = true;
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: values.identifier,
          password: values.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toastError("Sign-in failed", data.error || "Invalid email/username or password.");
        return;
      }

      const data = await res.json();
      success("Welcome back", `Signed in as ${data.user.role}`);
      router.push(callbackUrl);
      router.refresh();
    } catch {
      toastError("Sign-in failed", "Unable to reach the server. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-light px-4">
      <ToastContainer />
      <Card className="w-full max-w-md shadow-lg rounded-2xl border border-gray-light">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center">
            <Logo width={48} height={48} />
          </div>
          <CardTitle className="text-2xl font-bold text-charcoal">OTTOMAN FC CONNECT</CardTitle>
          <CardDescription className="text-gray-secondary">
            Welcome to the Ottoman FC Digital Management Portal.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-secondary w-5 h-5" />
                <Input
                  id="identifier"
                  label="Email or username"
                  placeholder="name@ottomanfc.com"
                  className="pl-10"
                  {...form.register("identifier")}
                />
                {form.formState.errors.identifier && (
                  <p className="text-xs text-danger mt-1">{form.formState.errors.identifier.message}</p>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-secondary w-5 h-5" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  placeholder="••••••••"
                  className="pl-10"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-danger mt-1">{form.formState.errors.password.message}</p>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-secondary hover:text-charcoal"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-center text-gray-secondary">
                  Contact your club administrator to request access.
                </p>
              </div>
              <Button
                type="submit"
                className="w-full py-3 text-base"
                disabled={isSubmitting}
              >
                Sign in
              </Button>
              <div className="flex justify-between text-xs">
                <Link href="/forgot-password" className="text-red-primary hover:underline">
                  Forgot password? Account recovery
                </Link>
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="pt-6 border-t border-gray-light">
          <p className="text-center text-xs text-gray-secondary">
            OTTOMAN FC CONNECT &bull; Secure authentication
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
