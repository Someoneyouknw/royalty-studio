/**
 * WhatsApp link helpers. The number always comes from site settings — never
 * hard-coded into a component — so the studio can change it without a deploy.
 */

/** Keep only digits; WhatsApp expects an international number without symbols. */
export function normalizeWhatsappNumber(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/[^\d]/g, "");
}

/**
 * Build a wa.me deep link with an optional pre-filled, URL-encoded message.
 * Returns null when no valid number is configured so callers can hide the CTA.
 */
export function buildWhatsappLink(
  number: string | null | undefined,
  message?: string | null,
): string | null {
  const digits = normalizeWhatsappNumber(number);
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  if (message && message.trim().length > 0) {
    return `${base}?text=${encodeURIComponent(message.trim())}`;
  }
  return base;
}

/** Contextual message for a specific service, e.g. from a service card. */
export function serviceWhatsappMessage(serviceTitle: string): string {
  return `Hello Royalty Studio, I am interested in ${serviceTitle}.`;
}

export const DEFAULT_WHATSAPP_MESSAGE =
  "Hello Royalty Studio, I would like to make an inquiry about a photography session.";
