"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = getBrowserClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError("Could not update your password. The reset link may have expired.");
      return;
    }
    toast.success("Password updated. You're all set.");
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream/50 px-6 py-12">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <div className="mb-4 text-center">
          <h1 className="font-serif text-2xl font-semibold">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a strong password for your studio account.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" loading={loading}>
          Update password
        </Button>
      </form>
    </div>
  );
}
