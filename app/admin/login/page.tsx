import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream/50 px-6 py-12">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <LoginForm />
      </Suspense>
      <Link
        href="/"
        className="mt-8 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to website
      </Link>
    </div>
  );
}
