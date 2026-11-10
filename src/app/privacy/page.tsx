import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-light px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <nav className="mb-8">
          <Link href="/" className="text-sm text-red-primary hover:underline">
            ← Back to home
          </Link>
        </nav>

        <h1 className="text-3xl font-bold text-charcoal mb-6">Privacy Policy</h1>

        <div className="prose prose-gray max-w-none">
          <p className="mb-4">
            Ottoman FC Connect (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This
            policy explains how we collect, use, and protect your information.
          </p>

          <h2 className="text-xl font-semibold text-charcoal mt-8 mb-2">1. Information We Collect</h2>
          <p className="mb-4">
            We collect personal information you provide when registering, including name, email,
            phone number, date of birth, and player details.
          </p>

          <h2 className="text-xl font-semibold text-charcoal mt-8 mb-2">2. How We Use Your Information</h2>
          <p className="mb-4">
            We use your information to manage club operations, process registrations, and
            communicate with you about your account.
          </p>

          <h2 className="text-xl font-semibold text-charcoal mt-8 mb-2">3. Data Sharing</h2>
          <p className="mb-4">
            We do not share your personal information with third parties except as required by law.
          </p>

          <h2 className="text-xl font-semibold text-charcoal mt-8 mb-2">4. Data Security</h2>
          <p className="mb-4">
            We implement appropriate security measures to protect your information from unauthorized
            access.
          </p>

          <h2 className="text-xl font-semibold text-charcoal mt-8 mb-2">5. Your Rights</h2>
          <p className="mb-4">
            You may request access to, correction of, or deletion of your personal data by
            contacting the club administrator.
          </p>

          <p className="mt-8 text-sm text-gray-secondary">
            Last updated: November 2026
          </p>
        </div>
      </div>
    </div>
  );
}
