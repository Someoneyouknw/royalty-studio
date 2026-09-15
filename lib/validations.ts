import { z } from "zod";
import { INQUIRY_STATUSES } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */
const uuid = z.string().uuid();
const optionalString = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .or(z.literal("").transform(() => undefined));

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */
export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(140)
    .regex(/^[a-z0-9-]+$/, "Slug may contain lowercase letters, numbers and hyphens")
    .optional(),
  description: optionalString,
  cover_image_url: z.string().url().optional().nullable(),
  display_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

/** How to handle photos when deleting a non-empty category. */
export const categoryDeleteSchema = z.object({
  mode: z.enum(["move", "delete", "cancel"]).default("move"),
  target_category_id: uuid.optional(),
});

/* ------------------------------------------------------------------ */
/* Photos                                                              */
/* ------------------------------------------------------------------ */
export const photoCreateSchema = z.object({
  category_id: uuid.nullable().optional(),
  title: optionalString,
  description: optionalString,
  alt_text: optionalString,
  image_url: z.string().url(),
  thumbnail_url: z.string().url().optional().nullable(),
  storage_path: z.string().min(1),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  file_size: z.number().int().positive().optional().nullable(),
  is_featured: z.boolean().optional(),
  is_published: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
});
export type PhotoCreateInput = z.infer<typeof photoCreateSchema>;

export const photoUpdateSchema = z.object({
  category_id: uuid.nullable().optional(),
  title: optionalString,
  description: optionalString,
  alt_text: optionalString,
  is_featured: z.boolean().optional(),
  is_published: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
});

export const photoBulkSchema = z.object({
  ids: z.array(uuid).min(1, "Select at least one photo"),
  action: z.enum([
    "delete",
    "publish",
    "unpublish",
    "feature",
    "unfeature",
    "move",
  ]),
  category_id: uuid.nullable().optional(),
});

export const reorderSchema = z.object({
  items: z
    .array(z.object({ id: uuid, display_order: z.number().int().min(0) }))
    .min(1),
});

/* ------------------------------------------------------------------ */
/* Services                                                            */
/* ------------------------------------------------------------------ */
export const serviceSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(140),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: optionalString,
  image_url: z.string().url().optional().nullable(),
  price: z.number().nonnegative().optional().nullable(),
  price_type: z.enum(["fixed", "starting_from", "custom"]).optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

/* ------------------------------------------------------------------ */
/* Testimonials                                                        */
/* ------------------------------------------------------------------ */
export const testimonialSchema = z.object({
  client_name: z.string().trim().min(1, "Client name is required").max(120),
  client_role: optionalString,
  testimonial: z.string().trim().min(1, "Testimonial text is required").max(2000),
  image_url: z.string().url().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  is_featured: z.boolean().optional(),
  is_published: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
});
export type TestimonialInput = z.infer<typeof testimonialSchema>;

/* ------------------------------------------------------------------ */
/* Inquiries                                                           */
/* ------------------------------------------------------------------ */
export const inquiryCreateSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name").max(120),
    email: z
      .string()
      .trim()
      .email("Enter a valid email")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    phone: z
      .string()
      .trim()
      .min(6, "Enter a valid phone number")
      .max(30)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    service_id: uuid.optional().nullable(),
    preferred_date: z.string().trim().max(40).optional(),
    preferred_time: z.string().trim().max(40).optional(),
    location: z.string().trim().max(200).optional(),
    number_of_people: z.coerce.number().int().min(0).max(100000).optional(),
    message: z.string().trim().max(4000).optional(),
    // Honeypot — must stay empty. Basic bot protection.
    company: z.string().max(0).optional(),
  })
  .refine((d) => d.email || d.phone, {
    message: "Provide at least an email or a phone number",
    path: ["email"],
  });
export type InquiryInput = z.infer<typeof inquiryCreateSchema>;

export const inquiryUpdateSchema = z.object({
  status: z.enum(INQUIRY_STATUSES),
});

/* ------------------------------------------------------------------ */
/* Chat                                                                */
/* ------------------------------------------------------------------ */
export const conversationCreateSchema = z.object({
  visitor_name: z.string().trim().min(1, "Name is required").max(120),
  visitor_email: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  visitor_phone: z.string().trim().max(30).optional(),
  message: z.string().trim().min(1, "Message is required").max(4000),
});

export const messageCreateSchema = z.object({
  conversation_id: uuid,
  message: z.string().trim().min(1).max(4000),
  sender_type: z.enum(["client", "admin"]).default("client"),
});

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */
const urlOrEmpty = z
  .string()
  .trim()
  .url()
  .optional()
  .or(z.literal("").transform(() => null))
  .nullable();

export const settingsSchema = z.object({
  studio_name: z.string().trim().min(1).max(140).optional(),
  tagline: z.string().trim().max(200).optional().nullable(),
  logo_url: urlOrEmpty,
  favicon_url: urlOrEmpty,
  phone: z.string().trim().max(40).optional().nullable(),
  whatsapp: z.string().trim().max(40).optional().nullable(),
  whatsapp_default_message: z.string().trim().max(500).optional().nullable(),
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal("").transform(() => null))
    .nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  map_embed_url: urlOrEmpty,
  opening_hours: z.string().trim().max(500).optional().nullable(),
  instagram_url: urlOrEmpty,
  facebook_url: urlOrEmpty,
  tiktok_url: urlOrEmpty,
  youtube_url: urlOrEmpty,
  x_url: urlOrEmpty,
  hero_image_url: urlOrEmpty,
  hero_title: z.string().trim().max(140).optional().nullable(),
  hero_subtitle: z.string().trim().max(240).optional().nullable(),
  hero_labels: z.string().trim().max(300).optional().nullable(),
  about_image_url: urlOrEmpty,
  about_text: z.string().trim().max(4000).optional().nullable(),
  seo_title: z.string().trim().max(200).optional().nullable(),
  seo_description: z.string().trim().max(400).optional().nullable(),
  og_image_url: urlOrEmpty,
});
export type SettingsInput = z.infer<typeof settingsSchema>;
