"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/dashboard-layout";
import { useToastActions } from "@/components/ui/toast";
import { ClipboardList, Save, Plus, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

interface TacticalPlayer {
  id: string;
  player_id: string;
  name: string;
  jersey_number: number | null;
  role: string;
  position_x: number;
  position_y: number;
}

const PITCH_WIDTH = 600;
const PITCH_HEIGHT = 400;

export default function TacticalBoardPage() {
  const { success, error } = useToastActions();
  const [players, setPlayers] = React.useState<TacticalPlayer[]>([
    { id: "1", player_id: "gk", name: "Goalkeeper", jersey_number: 1, role: "GK", position_x: 40, position_y: 200 },
    { id: "2", player_id: "lb", name: "Left Back", jersey_number: 2, role: "LB", position_x: 120, position_y: 120 },
    { id: "3", player_id: "cb1", name: "Center Back", jersey_number: 4, role: "CB", position_x: 180, position_y: 200 },
    { id: "4", player_id: "cb2", name: "Center Back", jersey_number: 5, role: "CB", position_x: 180, position_y: 280 },
    { id: "5", player_id: "rb", name: "Right Back", jersey_number: 3, role: "RB", position_x: 120, position_y: 280 },
    { id: "6", player_id: "cdm", name: "Defensive Mid", jersey_number: 6, role: "CDM", position_x: 300, position_y: 200 },
    { id: "7", player_id: "lm", name: "Left Mid", jersey_number: 7, role: "LM", position_x: 420, position_y: 120 },
    { id: "8", player_id: "cm", name: "Central Mid", jersey_number: 8, role: "CM", position_x: 420, position_y: 200 },
    { id: "9", player_id: "rm", name: "Right Mid", jersey_number: 11, role: "RM", position_x: 420, position_y: 280 },
    { id: "10", player_id: "st1", name: "Striker", jersey_number: 9, role: "ST", position_x: 540, position_y: 160 },
    { id: "11", player_id: "st2", name: "Striker", jersey_number: 10, role: "ST", position_x: 540, position_y: 240 },
  ]);
  const [formation, setFormation] = React.useState("4-4-2");
  const [editing, setEditing] = React.useState<TacticalPlayer | null>(null);
  const [formData, setFormData] = React.useState({ name: "", jersey_number: "", role: "" });

  const handleDragStart = (e: React.DragEvent, player: TacticalPlayer) => {
    e.dataTransfer.setData("application/json", JSON.stringify(player));
  };

  const handleDrop = (e: React.DragEvent) => {
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    const player = JSON.parse(data) as TacticalPlayer;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / PITCH_WIDTH) * 100;
    const y = ((e.clientY - rect.top) / PITCH_HEIGHT) * 100;
    setPlayers((prev) =>
      prev.map((p) => (p.id === player.id ? { ...player, position_x: x, position_y: y } : p))
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePositionClick = (player: TacticalPlayer) => {
    setEditing(player);
    setFormData({ name: player.name, jersey_number: String(player.jersey_number ?? ""), role: player.role });
  };

  const removePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const savePlayer = () => {
    if (!editing) return;
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === editing!.id
          ? {
              ...p,
              name: formData.name,
              jersey_number: formData.jersey_number ? Number(formData.jersey_number) : null,
              role: formData.role,
            }
          : p
      )
    );
    setEditing(null);
  };

  const savePlan = () => {
    success("Tactical plan saved", "Formation and player positions stored.");
  };

  return (
    <DashboardLayout role="administrator" userName="Administrator">
      <PageHeader title="Tactical Board" description="Drag players to set positions and save formations." />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle>Pitch</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex items-center justify-center bg-[#1a4a1a] min-h-[500px]">
              <div
                className="relative bg-green-700 rounded-lg shadow-2xl border-4 border-green-900"
                style={{ width: PITCH_WIDTH, height: PITCH_HEIGHT }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {/* Pitch markings */}
                <svg
                  className="absolute inset-0"
                  width={PITCH_WIDTH}
                  height={PITCH_HEIGHT}
                  pointerEvents="none"
                >
                  <rect x="0" y="0" width={PITCH_WIDTH} height={PITCH_HEIGHT} fill="none" stroke="white" strokeWidth="2" strokeDasharray="4" />
                  <line x1={PITCH_WIDTH / 2} y1={0} x2={PITCH_WIDTH / 2} y2={PITCH_HEIGHT} stroke="white" strokeWidth="2" />
                  <circle cx={PITCH_WIDTH / 2} cy={PITCH_HEIGHT / 2} r={40} fill="none" stroke="white" strokeWidth="2" />
                  <rect x={30} y={80} width={120} height={240} fill="none" stroke="white" strokeWidth="2" />
                  <rect x={PITCH_WIDTH - 150} y={80} width={120} height={240} fill="none" stroke="white" strokeWidth="2" />
                </svg>
                {players.map((p) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, p)}
                    onClick={() => handlePositionClick(p)}
                    className="absolute w-10 h-10 rounded-full bg-red-primary text-white flex items-center justify-center text-xs font-bold shadow-md border-2 border-white cursor-move select-none transform transition-transform active:scale-110"
                    style={{
                      left: `${(p.position_x / 100) * PITCH_WIDTH - 25}px`,
                      top: `${(p.position_y / 100) * PITCH_HEIGHT - 25}px`,
                    }}
                    title={`${p.name} (#${p.jersey_number ?? "?"}) - ${p.role}`}
                  >
                    {p.jersey_number ?? "?"}
                    <button
                      onClick={(e) => { e.stopPropagation(); removePlayer(p.id); }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-72 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Players</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>#</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Pos</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-sm">{p.name}</TableCell>
                      <TableCell className="text-sm font-mono">{p.jersey_number ?? "\u2014"}</TableCell>
                      <TableCell className="text-sm capitalize">{p.role}</TableCell>
                      <TableCell className="text-sm text-gray-secondary">
                        {Math.round(p.position_x)},{Math.round(p.position_y)}
                      </TableCell>
                      <TableCell>
                        {editing?.id === p.id ? (
                          <Button size="sm" onClick={savePlayer}>Save</Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handlePositionClick(p)}>
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {editing && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Player</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  label="Jersey Number"
                  type="number"
                  value={formData.jersey_number}
                  onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                />
                <Input
                  label="Role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={savePlayer}>
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Formation</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                label="Formation"
                value={formation}
                onChange={(e) => setFormation(e.target.value)}
                placeholder="e.g. 4-4-2"
              />
              <Button size="sm" onClick={savePlan}>
                <Save className="w-4 h-4 mr-2" />
                Save Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
