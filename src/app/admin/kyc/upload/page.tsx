"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToastActions } from "@/components/ui/toast";
import { Upload, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/dashboard-layout";

const uploadSchema = z.object({
  player_id: z.string().min(1, "Player ID is required"),
  document_type: z.string().min(1, "Document type is required"),
  document_reference: z.string().optional(),
  expiry_date: z.string().optional(),
});

type UploadValues = z.infer<typeof uploadSchema>;

export default function KycUploadPage() {
  const router = useRouter();
  const { success, error } = useToastActions();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);

  const form = useForm<UploadValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { player_id: "", document_type: "", document_reference: "", expiry_date: "" },
  });

  const onSubmit = async (values: UploadValues) => {
    if (!uploadedFile) {
      error("Upload failed", "Please select a file to upload.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("player_id", values.player_id);
      formData.append("document_type", values.document_type);
      if (values.document_reference) formData.append("document_reference", values.document_reference);
      if (values.expiry_date) formData.append("expiry_date", values.expiry_date);
      formData.append("file", uploadedFile);

      const res = await fetch("/api/kyc/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error("Upload failed", data.error || "Could not upload document.");
        return;
      }

      success("Document uploaded", "KYC document has been uploaded successfully.");
      form.reset();
      setUploadedFile(null);
      router.push("/admin/kyc/review");
      router.refresh();
    } catch {
      error("Upload failed", "Unable to reach the server. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setUploadedFile(file);
  };

  return (
    <DashboardLayout role="administrator" userName="Administrator">
      <PageHeader
        title="Upload KYC Document"
        description="Upload player identity documents for verification."
      />

      <Card>
        <CardHeader>
          <CardTitle>KYC Document Upload</CardTitle>
          <CardDescription className="mt-2">
            Upload identity documents for a player. Documents will be reviewed by administrators.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Player ID"
                placeholder="e.g. OTF-2026-0001"
                {...form.register("player_id")}
              />
              <Input
                label="Document Type"
                placeholder="e.g. National ID, Passport, Birth Certificate"
                {...form.register("document_type")}
              />
            </div>
            <Input
              label="Document Reference (optional)"
              placeholder="e.g. NIN-12345678"
              {...form.register("document_reference")}
            />
            <Input
              type="date"
              label="Expiry Date (optional)"
              {...form.register("expiry_date")}
            />

            <div className="border-2 border-dashed border-gray-light rounded-lg p-8 text-center hover:border-red-primary transition-colors">
              <Upload className="w-8 h-8 text-gray-secondary mb-2" />
              <p className="text-sm text-gray-secondary">Click to upload document</p>
              <input
                type="file"
                className="sr-only"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
              />
              {uploadedFile && (
                <p className="text-xs text-success mt-1">
                  {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full py-3 text-base flex items-center justify-center"
              disabled={isSubmitting || !uploadedFile}
            >
              {isSubmitting ? (
                <>
                  <Plus className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" /> Upload Document
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="pt-6 border-t border-gray-light">
          <Button variant="outline" className="w-full" onClick={() => router.push("/admin/kyc/review")}>
            View All KYC Documents
          </Button>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
}
