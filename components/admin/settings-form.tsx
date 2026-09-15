"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { SiteSettings } from "@/types/database";
import { apiFetch, type ApiError } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { PageTitle } from "@/components/admin/page-title";

type S = SiteSettings;

export function SettingsForm({ initial }: { initial: S }) {
  const [s, setS] = useState<S>(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  function set<K extends keyof S>(key: K, value: S[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setErrors({});
    try {
      const { id: _id, updated_at: _u, ...payload } = s;
      const updated = await apiFetch<S>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setS(updated);
      toast.success("Settings saved.");
    } catch (e) {
      const err = e as ApiError;
      if (err.fieldErrors) setErrors(err.fieldErrors);
      toast.error(err.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  const field = (key: keyof S) => errors[key as string]?.[0];

  return (
    <div>
      <PageTitle
        title="Website Settings"
        description="Update your studio's information — no code required."
        action={<Button onClick={save} loading={saving}>Save changes</Button>}
      />

      <Tabs defaultValue="branding">
        <TabsList className="flex-wrap">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* Branding */}
        <TabsContent value="branding">
          <Card>
            <Text label="Studio name" value={s.studio_name} onChange={(v) => set("studio_name", v)} error={field("studio_name")} />
            <Text label="Tagline" value={s.tagline} onChange={(v) => set("tagline", v)} />
            <div className="grid gap-6 sm:grid-cols-2">
              <ImageUploadField label="Logo" bucket="branding" value={s.logo_url} onChange={(v) => set("logo_url", v)} aspect="aspect-[3/1]" />
              <ImageUploadField label="Favicon" bucket="branding" value={s.favicon_url} onChange={(v) => set("favicon_url", v)} aspect="aspect-square max-w-[8rem]" />
            </div>
          </Card>
        </TabsContent>

        {/* Contact */}
        <TabsContent value="contact">
          <Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="Phone" value={s.phone} onChange={(v) => set("phone", v)} />
              <Text label="WhatsApp number (digits, incl. country code)" value={s.whatsapp} onChange={(v) => set("whatsapp", v)} placeholder="2348012345678" />
            </div>
            <Text label="Email" value={s.email} onChange={(v) => set("email", v)} error={field("email")} />
            <Area label="Default WhatsApp message" value={s.whatsapp_default_message} onChange={(v) => set("whatsapp_default_message", v)} />
            <Area label="Address" value={s.address} onChange={(v) => set("address", v)} />
            <Text label="Opening hours" value={s.opening_hours} onChange={(v) => set("opening_hours", v)} placeholder="Mon–Sat: 9am – 6pm" />
            <Text label="Google Maps embed URL (optional)" value={s.map_embed_url} onChange={(v) => set("map_embed_url", v)} error={field("map_embed_url")} placeholder="https://www.google.com/maps/embed?..." />
            <p className="text-xs text-muted-foreground">
              The map only appears on the contact page when a real embed URL is set.
            </p>
          </Card>
        </TabsContent>

        {/* Social */}
        <TabsContent value="social">
          <Card>
            <p className="text-sm text-muted-foreground">
              Only platforms with a URL are shown on your website. Leave blank to hide.
            </p>
            <Text label="Instagram URL" value={s.instagram_url} onChange={(v) => set("instagram_url", v)} error={field("instagram_url")} />
            <Text label="Facebook URL" value={s.facebook_url} onChange={(v) => set("facebook_url", v)} error={field("facebook_url")} />
            <Text label="TikTok URL" value={s.tiktok_url} onChange={(v) => set("tiktok_url", v)} error={field("tiktok_url")} />
            <Text label="YouTube URL" value={s.youtube_url} onChange={(v) => set("youtube_url", v)} error={field("youtube_url")} />
            <Text label="X (Twitter) URL" value={s.x_url} onChange={(v) => set("x_url", v)} error={field("x_url")} />
          </Card>
        </TabsContent>

        {/* Homepage */}
        <TabsContent value="homepage">
          <Card>
            <ImageUploadField label="Hero background image (the big photo behind the headline)" bucket="branding" value={s.hero_image_url} onChange={(v) => set("hero_image_url", v)} />
            <Text
              label="Hero title (big headline)"
              value={s.hero_title}
              onChange={(v) => set("hero_title", v)}
              placeholder="Royalty Studio"
            />
            <Text
              label="Hero tagline (top-right text — leave blank to hide it)"
              value={s.hero_subtitle}
              onChange={(v) => set("hero_subtitle", v)}
              placeholder="Capturing Moments. Creating Memories."
            />
            <Text
              label="Hero labels (top-left list — separate with commas; leave blank to hide)"
              value={s.hero_labels}
              onChange={(v) => set("hero_labels", v)}
              placeholder="Weddings, Portraits, Editorial, Events"
            />
            <ImageUploadField label="About image" bucket="branding" value={s.about_image_url} onChange={(v) => set("about_image_url", v)} aspect="aspect-[4/5] max-w-[16rem]" />
            <Area label="About text" value={s.about_text} onChange={(v) => set("about_text", v)} rows={5} />
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo">
          <Card>
            <Text label="Default SEO title" value={s.seo_title} onChange={(v) => set("seo_title", v)} />
            <Area label="Default SEO description" value={s.seo_description} onChange={(v) => set("seo_description", v)} />
            <ImageUploadField label="Social share image (Open Graph)" bucket="branding" value={s.og_image_url} onChange={(v) => set("og_image_url", v)} />
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <Button onClick={save} loading={saving}>Save changes</Button>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      {children}
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string | null;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={rows} />
    </div>
  );
}
