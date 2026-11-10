import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db, requireDatabase } from "@/lib/db";
import { DashboardLayout, PageHeader } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface UserRow {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

async function getUsers(page: number, limit: number) {
  const offset = (page - 1) * limit;

  const countResult = await db.query("SELECT count(*) FROM users");
  const totalCount = parseInt(countResult.rows[0].count as string, 10);

  const result = await db.query(
    `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.role, u.is_active, u.last_login_at, u.created_at
     FROM users u
     ORDER BY u.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return { rows: result.rows as UserRow[], total: totalCount };
}

export default async function UsersPage({ searchParams }: { searchParams: { page?: string } }) {
  try {
    await requireDatabase();
  } catch {
    redirect("/database-unavailable");
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "administrator") redirect("/login?error=access_denied");

  const page = Math.max(parseInt(searchParams.page || "1", 10), 1);
  const limit = 25;

  const { rows: users, total } = await getUsers(page, limit).catch(() => ({ rows: [], total: 0 }));
  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout role={user.role} userName={user.first_name || user.username}>
      <PageHeader
        title="Users"
        description="Manage club user accounts and roles."
      />

      <div className="mb-6 flex items-center gap-3">
        <Users size={20} />
        <h2 className="text-xl font-bold text-charcoal">Users</h2>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-secondary">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-charcoal">{u.username}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">{u.email}</TableCell>
                      <TableCell className="text-sm">
                        {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : "\u2014"}
                      </TableCell>
                      <TableCell className="text-sm capitalize">{u.role}</TableCell>
                      <TableCell className="text-sm">{u.is_active ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "\u2014"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {total > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-secondary">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} users
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/?page=${page - 1}`}
              className={`px-4 py-2 text-sm border rounded-md text-charcoal ${page === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </Link>
            <span className="px-2 text-sm text-charcoal">
              Page {page} of {totalPages}
            </span>
            <Link
              href={`/?page=${page + 1}`}
              className={`px-4 py-2 text-sm border rounded-md text-charcoal ${page === totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
