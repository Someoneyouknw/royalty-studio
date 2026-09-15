"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps extends Omit<ButtonProps, "asChild"> {
  number: string | null | undefined;
  message?: string | null;
  label?: string;
}

/** A WhatsApp CTA. Renders nothing if no number is configured. */
export function WhatsAppButton({
  number,
  message,
  label = "Chat on WhatsApp",
  className,
  variant = "outline",
  ...props
}: WhatsAppButtonProps) {
  const href = buildWhatsappLink(number, message);
  if (!href) return null;

  return (
    <Button asChild variant={variant} className={className} {...props}>
      <Link href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="text-[#25D366]" />
        {label}
      </Link>
    </Button>
  );
}

/** Floating WhatsApp bubble, bottom-left so it never collides with the chat. */
export function WhatsAppFloat({
  number,
  message,
}: {
  number: string | null | undefined;
  message?: string | null;
}) {
  const href = buildWhatsappLink(number, message);
  if (!href) return null;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={cn(
        "fixed bottom-5 left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2",
      )}
    >
      <MessageCircle className="h-7 w-7" />
    </Link>
  );
}
