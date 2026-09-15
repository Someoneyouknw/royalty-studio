"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTitle } from "@/components/admin/page-title";

export function AccountForm({
  email,
  fullName,
}: {
  email: string;
  fullName: string;
}) {
  const supabase = getBrowserClient();
  const [name, setName] = useState(fullName);
  const [savingName, setSavingName] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  async function saveName() {
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
    if (!error) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from("profiles").update({ full_name: name }).eq("id", userData.user.id);
      }
    }
    setSavingName(false);
    error ? toast.error("Could not update name.") : toast.success("Profile updated.");
  }

  async function savePassword() {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPw(false);
    if (error) {
      toast.error("Could not update password.");
      return;
    }
    setPassword("");
    setConfirm("");
    toast.success("Password updated.");
  }

  return (
    <div className="max-w-xl">
      <PageTitle title="Account" description="Manage your admin profile and password." />

      <div className="space-y-6">
        <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Profile</h2>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} disabled />
            <p className="text-xs text-muted-foreground">
              Your sign-in email. Contact your Supabase project owner to change it.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button onClick={saveName} loading={savingName}>Save profile</Button>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Change password</h2>
          <div className="space-y-1.5">
            <Label htmlFor="pw">New password</Label>
            <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw2">Confirm password</Label>
            <Input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
          <Button onClick={savePassword} loading={savingPw}>Update password</Button>
        </section>
      </div>
    </div>
  );
}
