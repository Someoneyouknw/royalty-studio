import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Admin pages are always dynamic (per-request auth).
export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const role = user?.profile?.role;

  // Server-side authorization (middleware is the first line; this is the second).
  if (!user || (role !== "admin" && role !== "staff")) {
    redirect("/admin/login");
  }

  const settings = await getSettings();

  return (
    <AdminShell email={user.email ?? ""} studioName={settings.studio_name}>
      {children}
    </AdminShell>
  );
}
