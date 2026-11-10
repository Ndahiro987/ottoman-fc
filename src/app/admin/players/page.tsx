"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/dashboard-layout";
import { useToastActions } from "@/components/ui/toast";
import { Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ChevronLeft, ChevronRight } from "lucide-react";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "warning",
    active: "success",
    injured: "gray",
    suspended: "danger",
    "on trial": "info",
    inactive: "gray",
    released: "gray",
  };
  return <Badge variant={(map[status] || "gray") as "success" | "warning" | "gray" | "danger" | "primary"}>{status}</Badge>;
};

interface Player {
  id: string;
  player_id: string;
  full_name: string;
  player_category?: string;
  primary_position?: string;
  status: string;
  kyc_status: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PlayersResponse {
  players: Player[];
  pagination: PaginationData;
}

export default function PlayersPage() {
  const { error } = useToastActions();
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [pagination, setPagination] = React.useState<PaginationData>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [search, setSearch] = React.useState("");

  const loadPlayers = React.useCallback(async () => {
    try {
      const res = await fetch(
        `/api/players?search=${encodeURIComponent(search)}&page=${pagination.page}&limit=${pagination.limit}`
      );
      if (res.ok) {
        const data: PlayersResponse = await res.json();
        setPlayers(data.players || []);
        setPagination((prev) => ({ ...prev, ...data.pagination }));
      }
    } catch {
      error("Failed to load players");
    }
  }, [search, pagination.page, pagination.limit, error]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPlayers();
  }, [loadPlayers]);

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page }));
    loadPlayers();
  };

  return (
    <DashboardLayout role="administrator" userName="Administrator">
      <PageHeader
        title="Player Directory"
        description="Searchable directory of all registered players."
      />

      <div className="flex gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-secondary w-4 h-4" />
          <Input
            placeholder="Search by name or player ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button>Export Player Register</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>KYC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-secondary">
                      No players found.
                    </TableCell>
                  </TableRow>
                ) : (
                  players.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.player_id}</TableCell>
                      <TableCell className="font-medium text-charcoal">{p.full_name}</TableCell>
                      <TableCell className="text-sm">{p.player_category || "\u2014"}</TableCell>
                      <TableCell className="text-sm">{p.primary_position || "\u2014"}</TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell>{statusBadge(p.kyc_status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {pagination.total > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-secondary">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} players
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            <span className="px-2 text-sm text-charcoal">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
