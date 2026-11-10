"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, AlertCircle, Server } from "lucide-react";

export default function DatabaseUnavailable() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-light px-4">
      <Card className="w-full max-w-2xl shadow-lg rounded-2xl border border-gray-light">
        <CardHeader className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
            <Database size={28} />
          </div>
          <CardTitle className="text-2xl font-bold text-charcoal">Database Connection Required</CardTitle>
          <p className="text-gray-secondary">OTTOMAN FC CONNECT requires a PostgreSQL database to operate.</p>
        </CardHeader>
        <CardContent className="space-y-4 p-8">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Server className="w-5 h-5 text-gray-secondary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-charcoal">1. Start PostgreSQL</p>
                <p className="text-sm text-gray-secondary">Ensure a PostgreSQL server is running on the configured host and port.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gray-secondary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-charcoal">2. Configure credentials</p>
                <p className="text-sm text-gray-secondary">Set <code className="text-red-primary bg-gray-light px-1 py-0.5 rounded">DATABASE_URL</code> in <code className="text-sm text-gray-secondary bg-gray-light px-1 py-0.5 rounded">.env.local</code>.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gray-secondary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-charcoal">3. Initialize the schema</p>
                <p className="text-sm text-gray-secondary">Call <code className="text-red-primary bg-gray-light px-1 py-0.5 rounded">POST /api/setup</code> to create tables and seed the default administrator account.</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-light rounded-lg p-4 text-xs text-gray-secondary font-mono overflow-x-auto">
            Example .env.local:<br />
            DATABASE_URL=postgresql://ottomanfc:password@localhost:5432/ottomanfc
          </div>
          <div className="flex justify-center pt-4">
            <Button onClick={() => location.reload()}>Retry connection</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
