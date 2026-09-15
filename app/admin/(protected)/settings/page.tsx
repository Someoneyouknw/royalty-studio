import { getSettings } from "@/lib/data";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return <SettingsForm initial={settings} />;
}
