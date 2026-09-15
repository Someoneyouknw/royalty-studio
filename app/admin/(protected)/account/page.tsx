import { getCurrentUser } from "@/lib/auth";
import { AccountForm } from "@/components/admin/account-form";

export default async function AdminAccountPage() {
  const user = await getCurrentUser();
  return (
    <AccountForm
      email={user?.email ?? ""}
      fullName={user?.profile?.full_name ?? ""}
    />
  );
}
