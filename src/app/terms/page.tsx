import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-light px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <nav className="mb-8">
          <Link href="/" className="text-sm text-red-primary hover:underline">
            ← Back to home
          </Link>
        </nav>

        <h1 className="text-3xl font-bold text-charcoal mb-6">Terms and Conditions</h1>

        <div className="prose prose-gray max-w-none">
          <p className="mb-4">
            Welcome to Ottoman FC Connect (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). These terms govern your use of our
            football club management platform.
          </p>

          <h2 className="text-xl font-semibold text-charcoal mt-8 mb-2">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing or using Ottoman FC Connect, you agree to be bound by these terms. If you
            do not agree, you may not use the platform.
          </p>

          <h2 className="text-xl font-semibold text-charcoal mt-8 mb-2">2. User Accounts</h2>
          <p className="mb-4">
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activities that occur under your account.
          </p>

          <h2 className="text-xl font-semibold text-charcoal mt-8 mb-2">3. Player Data</h2>
          <p className="mb-4">
            All player registration data is collected for club management purposes. We do not sell
            or share personal data with third parties.
          </p>

          <h2 className="text-xl font-semibold text-charcoal mt-8 mb-2">4. Limitation of Liability</h2>
          <p className="mb-4">
            Ottoman FC Connect is provided &quot;as is&quot; without warranty of any kind. We are not liable
            for any damages arising from your use of the platform.
          </p>

          <h2 className="text-xl font-semibold text-charcoal mt-8 mb-2">5. Governing Law</h2>
          <p className="mb-4">
            These terms are governed by the laws of Uganda.
          </p>

          <p className="mt-8 text-sm text-gray-secondary">
            Last updated: November 2026
          </p>
        </div>
      </div>
    </div>
  );
}
