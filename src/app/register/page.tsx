"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToastActions } from "@/components/ui/toast";
import Link from "next/link";
import { Upload, FileText, Trophy } from "lucide-react";

const registerSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(8, "Phone number is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  nationality: z.string().min(1, "Nationality is required"),
  national_id: z.string().min(1, "National ID is required"),
  passport_number: z.string().optional(),
  residential_address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_number: z.string().optional(),
  primary_position: z.string().optional(),
  secondary_position: z.string().optional(),
  preferred_foot: z.string().optional(),
  jersey_number: z.string().optional(),
  previous_club: z.string().optional(),
  football_experience: z.string().optional(),
  player_category: z.string().optional(),
  registration_date: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  terms: z.boolean().refine((v) => v === true, "You must accept the terms"),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { success, error } = useToastActions();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [passportPhoto, setPassportPhoto] = React.useState<File | null>(null);
  const [nationalIdPhoto, setNationalIdPhoto] = React.useState<File | null>(null);
  const passportInputRef = React.useRef<HTMLInputElement>(null);
  const nationalIdInputRef = React.useRef<HTMLInputElement>(null);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "", email: "", phone: "", date_of_birth: "", gender: "",
      nationality: "", national_id: "", passport_number: "",
      residential_address: "", emergency_contact_name: "", emergency_contact_number: "",
      primary_position: "", secondary_position: "", preferred_foot: "",
      jersey_number: "", previous_club: "", football_experience: "",
      player_category: "", registration_date: "", password: "", terms: false,
    },
  });

  const onSubmit = async (values: RegisterValues) => {
    if (!passportPhoto || !nationalIdPhoto) {
      error("Documents required", "Please upload both your passport photo and national ID.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("full_name", values.full_name);
      formData.append("email", values.email);
      formData.append("phone", values.phone);
      formData.append("date_of_birth", values.date_of_birth);
      formData.append("gender", values.gender);
      formData.append("nationality", values.nationality);
      formData.append("national_id", values.national_id);
      if (values.passport_number) formData.append("passport_number", values.passport_number);
      if (values.residential_address) formData.append("residential_address", values.residential_address);
      if (values.emergency_contact_name) formData.append("emergency_contact_name", values.emergency_contact_name);
      if (values.emergency_contact_number) formData.append("emergency_contact_number", values.emergency_contact_number);
      if (values.primary_position) formData.append("primary_position", values.primary_position);
      if (values.secondary_position) formData.append("secondary_position", values.secondary_position);
      if (values.preferred_foot) formData.append("preferred_foot", values.preferred_foot);
      if (values.jersey_number) formData.append("jersey_number", values.jersey_number);
      if (values.previous_club) formData.append("previous_club", values.previous_club);
      if (values.football_experience) formData.append("football_experience", values.football_experience);
      if (values.player_category) formData.append("player_category", values.player_category);
      if (values.registration_date) formData.append("registration_date", values.registration_date);
      formData.append("password", values.password);
      formData.append("passport_photo", passportPhoto);
      formData.append("national_id_photo", nationalIdPhoto);

      const res = await fetch("/api/auth/register-player", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error("Registration failed", data.error || data.message || "Could not register player.");
        return;
      }

      success("Registration submitted", "Your registration is pending administrator approval. You will be able to sign in once approved.");
      form.reset();
      setPassportPhoto(null);
      setNationalIdPhoto(null);
    } catch {
      error("Registration failed", "Unable to reach the server. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-light px-4 py-6">
      <Card className="w-full max-w-2xl shadow-lg rounded-2xl border border-gray-light">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center">
            <Trophy className="w-10 h-10 text-red-primary mx-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-charcoal">Player Registration</CardTitle>
          <CardDescription className="text-gray-secondary">
            Join Ottoman FC — register as a player and wait for administrator approval.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="full_name"
                label="Full legal name"
                placeholder="John Doe"
                {...form.register("full_name")}
              />
              <Input
                id="email"
                type="email"
                label="Email address"
                placeholder="name@ottomanfc.com"
                {...form.register("email")}
              />
              <Input
                id="phone"
                label="Phone number"
                placeholder="+256 700 000 000"
                {...form.register("phone")}
              />
              <Input
                id="date_of_birth"
                type="date"
                label="Date of birth"
                {...form.register("date_of_birth")}
              />
              <Input
                id="gender"
                label="Gender"
                placeholder="e.g. Male / Female"
                {...form.register("gender")}
              />
              <Input
                id="nationality"
                label="Nationality"
                placeholder="e.g. Ugandan"
                {...form.register("nationality")}
              />
              <Input
                id="national_id"
                label="National ID number"
                placeholder="e.g. CM1234567890"
                {...form.register("national_id")}
              />
              <Input
                id="passport_number"
                label="Passport number (optional)"
                placeholder="e.g. A1234567"
                {...form.register("passport_number")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="primary_position"
                label="Primary position"
                placeholder="e.g. Right Back"
                {...form.register("primary_position")}
              />
              <Input
                id="secondary_position"
                label="Secondary position (optional)"
                placeholder="e.g. Center Back"
                {...form.register("secondary_position")}
              />
              <Input
                id="preferred_foot"
                label="Preferred foot"
                placeholder="e.g. Left / Right"
                {...form.register("preferred_foot")}
              />
              <Input
                id="jersey_number"
                type="number"
                label="Jersey number (optional)"
                {...form.register("jersey_number")}
              />
              <Input
                id="player_category"
                label="Player category"
                placeholder="e.g. Senior team / U20"
                {...form.register("player_category")}
              />
              <Input
                id="previous_club"
                label="Previous club (optional)"
                placeholder="e.g. KCCA FC"
                {...form.register("previous_club")}
              />
              <Input
                id="football_experience"
                label="Years of experience (optional)"
                placeholder="e.g. 5 years"
                {...form.register("football_experience")}
              />
              <Input
                id="registration_date"
                type="date"
                label="Registration date (optional)"
                {...form.register("registration_date")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="residential_address"
                label="Residential address (optional)"
                placeholder="e.g. Plot 12, Kampala Road"
                {...form.register("residential_address")}
              />
              <Input
                id="emergency_contact_name"
                label="Emergency contact name (optional)"
                placeholder="e.g. Jane Doe"
                {...form.register("emergency_contact_name")}
              />
              <Input
                id="emergency_contact_number"
                label="Emergency contact phone (optional)"
                placeholder="+256 700 000 000"
                {...form.register("emergency_contact_number")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-red-primary" />
                  <label className="text-sm font-medium text-charcoal">Passport Photo <span className="text-danger">*</span></label>
                </div>
                <div className="border-2 border-dashed border-gray-light rounded-lg p-4 text-center hover:border-red-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    ref={passportInputRef}
                    onChange={(e) => setPassportPhoto(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => passportInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 text-sm text-red-primary font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    Choose passport photo
                  </button>
                  {passportPhoto && (
                    <p className="text-xs text-success mt-2">
                      {passportPhoto.name} ({Math.round(passportPhoto.size / 1024)} KB)
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-primary" />
                  <label className="text-sm font-medium text-charcoal">National ID Photo <span className="text-danger">*</span></label>
                </div>
                <div className="border-2 border-dashed border-gray-light rounded-lg p-4 text-center hover:border-red-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    ref={nationalIdInputRef}
                    onChange={(e) => setNationalIdPhoto(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => nationalIdInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 text-sm text-red-primary font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    Choose national ID photo
                  </button>
                  {nationalIdPhoto && (
                    <p className="text-xs text-success mt-2">
                      {nationalIdPhoto.name} ({Math.round(nationalIdPhoto.size / 1024)} KB)
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100">
              <p className="text-sm text-amber-800">
                <strong className="font-semibold">What happens next:</strong>
              </p>
              <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
                <li>Your registration will be reviewed by an administrator.</li>
                <li>You cannot sign in until your account is approved.</li>
                <li>Check your registration status after submitting.</li>
                <li>You will be notified once your account is active.</li>
              </ul>
            </div>

            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                className="w-4 h-4 mt-0.5 text-red-primary border-gray-light focus:ring-red-primary"
                {...form.register("terms")}
              />
              <label className="text-sm text-gray-secondary" htmlFor="terms">
                I accept the <Link href="/terms" className="text-red-primary hover:underline font-medium">terms and conditions</Link>
                and <Link href="/privacy" className="text-red-primary hover:underline font-medium">privacy policy</Link>
              </label>
            </div>
            {form.formState.errors.terms && (
              <p className="text-xs text-danger mt-1">{form.formState.errors.terms.message}</p>
            )}

            <Button type="submit" className="w-full py-4 text-lg font-semibold" disabled={isSubmitting || !passportPhoto || !nationalIdPhoto}>
              {isSubmitting ? "Submitting registration..." : "Submit Registration"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="pt-6 border-t border-gray-light">
          <p className="text-center text-xs text-gray-secondary">
            Already have an account?{" "}
            <Link href="/login" className="text-red-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
