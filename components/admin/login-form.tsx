"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { getBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = getBrowserClient();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error"));

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }
    const next = params.get("redirectedFrom") || "/admin/dashboard";
    router.push(next);
    router.refresh();
  }

  async function onReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const redirectTo = `${window.location.origin}/admin/auth/callback?next=/admin/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) {
      setError("We couldn't send the reset email. Please try again.");
      return;
    }
    toast.success("Password reset email sent. Check your inbox.");
    setMode("login");
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Camera className="h-6 w-6" />
        </div>
        <h1 className="font-serif text-2xl font-semibold">Studio Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login"
            ? "Sign in to manage your website."
            : "Enter your email to reset your password."}
        </p>
      </div>

      <form onSubmit={mode === "login" ? onLogin : onReset} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@studio.com"
          />
        </div>

        {mode === "login" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={() => {
                  setMode("reset");
                  setError(null);
                }}
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        )}

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" loading={loading}>
          {mode === "login" ? "Sign in" : "Send reset link"}
        </Button>

        {mode === "reset" && (
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Back to sign in
          </button>
        )}
      </form>
    </div>
  );
}
