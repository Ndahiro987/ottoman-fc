"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/branding/logo";
import { useToastActions, ToastContainer } from "@/components/ui/toast";

const setupSchema = z.object({
  email: z.string().email("Valid email is required"),
  username: z.string().min(2, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
});

type SetupValues = z.infer<typeof setupSchema>;

export default function SetupPage() {
  const router = useRouter();
  const { error: toastError, success } = useToastActions();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [setupDone, setSetupDone] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/setup-status", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && data.setupComplete) {
          router.push("/login");
          router.refresh();
        }
      } catch {
        // Ignore; form will surface errors on submit
      } finally {
        cancelled = true;
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const form = useForm<SetupValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: { email: "", username: "", password: "", first_name: "", last_name: "" },
  });

  const onSubmit = async (values: SetupValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toastError("Setup failed", data.error || "Database setup failed.");
        return;
      }

      const registerRes = await fetch("/api/auth/register-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          username: values.username,
          password: values.password,
          first_name: values.first_name,
          last_name: values.last_name,
        }),
      });

      if (!registerRes.ok) {
        const data = await registerRes.json().catch(() => ({}));
        toastError("Account creation failed", data.error || "Could not create administrator account.");
        return;
      }

      success("Administrator account created", "You can now sign in.");
      setSetupDone(true);
    } catch {
      toastError("Setup failed", "Unable to reach the server. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (setupDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-light px-4">
        <Card className="w-full max-w-md shadow-lg rounded-2xl border border-gray-light">
          <CardHeader className="text-center space-y-1">
            <div className="flex justify-center">
              <Logo width={48} height={48} />
            </div>
            <CardTitle className="text-2xl font-bold text-charcoal">Setup Complete</CardTitle>
            <CardDescription className="text-gray-secondary">
              Your administrator account has been created.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-sm text-charcoal">Sign in to access the Ottoman FC Connect portal.</p>
          </CardContent>
          <CardFooter className="pt-6 border-t border-gray-light">
            <Button className="w-full" onClick={() => router.push("/login")}>
              Go to Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-light px-4">
      <ToastContainer />
      <Card className="w-full max-w-md shadow-lg rounded-2xl border border-gray-light">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center">
            <Logo width={48} height={48} />
          </div>
          <CardTitle className="text-2xl font-bold text-charcoal">First-Time Setup</CardTitle>
          <CardDescription className="text-gray-secondary">
            Create the first administrator account for Ottoman FC Connect.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <ToastContainer />
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Email address"
              placeholder="admin@ottomanfc.com"
              {...form.register("email")}
            />
            <Input
              id="username"
              label="Username"
              placeholder="admin"
              {...form.register("username")}
            />
            <Input
              id="first_name"
              label="First name"
              placeholder="Club"
              {...form.register("first_name")}
            />
            <Input
              id="last_name"
              label="Last name"
              placeholder="Administrator"
              {...form.register("last_name")}
            />
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              {...form.register("password")}
            />
            <Button type="submit" className="w-full py-3 text-base" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create Administrator Account"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="pt-6 border-t border-gray-light">
          <p className="text-center text-xs text-gray-secondary">
            OTTOMAN FC CONNECT &bull; Secure first-time setup
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
