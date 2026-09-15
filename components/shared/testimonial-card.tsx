import Image from "next/image";
import { Quote } from "lucide-react";
import type { Testimonial } from "@/types/database";
import { Stars } from "@/components/shared/stars";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
      <Quote className="h-7 w-7 text-primary/30" aria-hidden />
      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
        “{testimonial.testimonial}”
      </blockquote>
      {testimonial.rating ? <Stars rating={testimonial.rating} className="mt-4" /> : null}
      <figcaption className="mt-4 flex items-center gap-3 border-t border-border pt-4">
        {testimonial.image_url ? (
          <Image
            src={testimonial.image_url}
            alt={testimonial.client_name}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-serif text-primary">
            {testimonial.client_name.charAt(0)}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">
            {testimonial.client_name}
          </p>
          {testimonial.client_role && (
            <p className="text-xs text-muted-foreground">{testimonial.client_role}</p>
          )}
        </div>
      </figcaption>
    </figure>
  );
}
