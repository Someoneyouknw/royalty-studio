import type { Testimonial } from "@/types/database";
import { SectionHeading } from "@/components/shared/section-heading";
import { TestimonialCard } from "@/components/shared/testimonial-card";

export function TestimonialsSection({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  if (testimonials.length === 0) return null;
  const shown = testimonials.slice(0, 6);
  return (
    <section className="container py-20 md:py-28">
      <SectionHeading
        eyebrow="Kind Words"
        title="What Our Clients Say"
        subtitle="The trust our clients place in us is the heart of everything we do."
      />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t) => (
          <TestimonialCard key={t.id} testimonial={t} />
        ))}
      </div>
    </section>
  );
}
