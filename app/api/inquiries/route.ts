import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { ok, created, handleError, fail } from "@/lib/api";
import { inquiryCreateSchema } from "@/lib/validations";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { inquiryReference } from "@/lib/utils";
import type { InquiryStatus } from "@/types/database";

// POST /api/inquiries — public booking/inquiry submission (rate-limited).
export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(clientKey(request, "inquiry"), {
      limit: 5,
      windowMs: 60_000,
    });
    if (!limit.success) {
      return fail("You're sending inquiries too quickly. Please wait a moment.", 429);
    }

    const body = await request.json();
    const parsed = inquiryCreateSchema.parse(body);

    // Honeypot: silently accept but do not store obvious bots.
    if (parsed.company && parsed.company.length > 0) {
      return created({ reference: "RS-OK" });
    }

    const { company: _company, ...insertData } = parsed;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("inquiries")
      .insert({ ...insertData, status: "new" })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("[inquiries] insert error:", error);
      return fail("Your message could not be sent. Please try again.", 500);
    }

    // NOTE: email notification hook — see README (email is not sent yet).
    return created({
      id: data.id,
      reference: inquiryReference(data.id, data.created_at),
    });
  } catch (error) {
    return handleError(error);
  }
}

// GET /api/inquiries — admin listing with search / status / service filters.
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const serviceId = searchParams.get("service");
    const sort = searchParams.get("sort") ?? "newest";

    let query = supabase
      .from("inquiries")
      .select("*, service:services(id, title)", { count: "exact" });

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
      );
    }
    if (status && status !== "all")
      query = query.eq("status", status as InquiryStatus);
    if (serviceId && serviceId !== "all") query = query.eq("service_id", serviceId);

    query = query.order("created_at", { ascending: sort === "oldest" });

    const { data, error, count } = await query;
    if (error) throw error;
    return ok({ inquiries: data ?? [], total: count ?? 0 });
  } catch (error) {
    return handleError(error);
  }
}
