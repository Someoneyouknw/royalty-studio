"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Service, SiteSettings } from "@/types/database";
import { apiFetch, type ApiError } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";

interface Props {
  services: Pick<Service, "id" | "title" | "slug">[];
  settings: SiteSettings;
  defaultServiceSlug?: string;
}

export function BookingForm({ services, settings, defaultServiceSlug }: Props) {
  const defaultServiceId =
    services.find((s) => s.slug === defaultServiceSlug)?.id ?? "";
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      service_id: fd.get("service_id") ? String(fd.get("service_id")) : null,
      preferred_date: String(fd.get("preferred_date") || ""),
      preferred_time: String(fd.get("preferred_time") || ""),
      location: String(fd.get("location") || ""),
      number_of_people: fd.get("number_of_people")
        ? Number(fd.get("number_of_people"))
        : undefined,
      message: String(fd.get("message") || ""),
      company: String(fd.get("company") || ""), // honeypot
    };

    try {
      const data = await apiFetch<{ reference: string }>("/api/inquiries", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setReference(data.reference);
      form.reset();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.fieldErrors) setFieldErrors(apiErr.fieldErrors);
      setError(apiErr.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (reference) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h3 className="mt-4 font-serif text-xl font-semibold text-emerald-900">
          Your inquiry has been sent!
        </h3>
        <p className="mt-2 text-sm text-emerald-800">
          Thank you — we&apos;ll be in touch shortly. Your reference number is{" "}
          <span className="font-semibold">{reference}</span>.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => setReference(null)}>
            Send another inquiry
          </Button>
          <WhatsAppButton
            number={settings.whatsapp}
            message={settings.whatsapp_default_message}
          />
        </div>
      </div>
    );
  }

  const err = (name: string) => fieldErrors[name]?.[0];

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Honeypot (hidden from users, catches bots) */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name *</Label>
          <Input id="name" name="name" required placeholder="Jane Doe" />
          {err("name") && <p className="text-xs text-destructive">{err("name")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" name="phone" type="tel" placeholder="+234 801 234 5678" />
          {err("phone") && <p className="text-xs text-destructive">{err("phone")}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" />
        {err("email") && <p className="text-xs text-destructive">{err("email")}</p>}
        <p className="text-xs text-muted-foreground">
          Provide at least a phone number or an email so we can reach you.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="service_id">Photography Service</Label>
          <select
            id="service_id"
            name="service_id"
            defaultValue={defaultServiceId}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select a service (optional)</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="City / venue" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="preferred_date">Preferred Date</Label>
          <Input id="preferred_date" name="preferred_date" type="date" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="preferred_time">Preferred Time</Label>
          <Input id="preferred_time" name="preferred_time" type="time" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="number_of_people">Number of People</Label>
          <Input
            id="number_of_people"
            name="number_of_people"
            type="number"
            min={0}
            placeholder="e.g. 2"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Tell us a little about what you have in mind…"
          className="min-h-[120px]"
        />
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto">
        Send Inquiry
      </Button>
    </form>
  );
}
