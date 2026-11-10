import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardRedirect() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const target =
    user.role === "administrator" ? "/admin" :
    user.role === "coach" ? "/coach" : "/player";

  redirect(target);
}
