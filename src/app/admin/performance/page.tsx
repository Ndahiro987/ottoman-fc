"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/dashboard-layout";
import { Activity, Users, Trophy, Target, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const recentMatches = [
  { opponent: "KCCA FC", competition: "Uganda Premier League", date: "2026-10-25", result: "W 2-1", status: "completed" },
  { opponent: "Vipers SC", competition: "Uganda Premier League", date: "2026-10-18", result: "D 1-1", status: "completed" },
  { opponent: "Express FC", competition: "Uganda Cup", date: "2026-10-10", result: "L 0-2", status: "completed" },
  { opponent: "SC Villa", competition: "Uganda Premier League", date: "2026-10-03", result: "W 3-0", status: "completed" },
  { opponent: "Maroons FC", competition: "FUFA Super 8", date: "2026-09-26", result: "W 1-0", status: "completed" },
];

const topPerformers = [
  { name: "Emmanuel Okwi", position: "ST", goals: 12, assists: 5, rating: 8.4 },
  { name: "Denis Onyango", position: "GK", goals: 0, assists: 0, rating: 7.9 },
  { name: "Muhammad Shaban", position: "RM", goals: 7, assists: 8, rating: 7.6 },
  { name: "Allan Kyambadde", position: "CM", goals: 4, assists: 6, rating: 7.3 },
  { name: "Ivan Nsibambi", position: "CB", goals: 2, assists: 1, rating: 7.1 },
];

export default function PerformancePage() {
  return (
    <DashboardLayout role="administrator" userName="Administrator">
      <PageHeader title="Performance Analytics" description="Team and player performance metrics." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-gray-light bg-white p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-secondary">Matches Played</p>
              <p className="text-2xl font-bold text-charcoal">5</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-primary/10 flex items-center justify-center text-red-primary">
              <Activity size={20} />
            </div>
          </div>
        </Card>
        <Card className="border-gray-light bg-white p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-secondary">Wins</p>
              <p className="text-2xl font-bold text-charcoal">3</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
              <Trophy size={20} />
            </div>
          </div>
        </Card>
        <Card className="border-gray-light bg-white p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-secondary">Goals Scored</p>
              <p className="text-2xl font-bold text-charcoal">7</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Target size={20} />
            </div>
          </div>
        </Card>
        <Card className="border-gray-light bg-white p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-secondary">Win Rate</p>
              <p className="text-2xl font-bold text-charcoal">60%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Activity size={20} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opponent</TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMatches.map((m) => (
                  <TableRow key={m.opponent + m.date}>
                    <TableCell className="font-medium text-charcoal">{m.opponent}</TableCell>
                    <TableCell className="text-sm">{m.competition}</TableCell>
                    <TableCell className="text-sm text-gray-secondary">{m.date}</TableCell>
                    <TableCell className="text-sm font-medium">{m.result}</TableCell>
                    <TableCell>
                      <Badge variant={m.status === "completed" ? "success" : "warning"}>{m.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Pos</TableHead>
                  <TableHead>Goals</TableHead>
                  <TableHead>Assists</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformers.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium text-sm">{p.name}</TableCell>
                    <TableCell className="text-sm capitalize">{p.position}</TableCell>
                    <TableCell className="text-sm font-mono">{p.goals}</TableCell>
                    <TableCell className="text-sm font-mono">{p.assists}</TableCell>
                    <TableCell className="text-sm font-bold">{p.rating}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
