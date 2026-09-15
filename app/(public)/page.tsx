import {
  getSettings,
  getFeaturedPhotos,
  getCategoriesWithCounts,
  getActiveServices,
  getPublishedTestimonials,
} from "@/lib/data";
import { Hero } from "@/components/home/hero";
import { FeaturedWork } from "@/components/home/featured-work";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { ServicesPreview } from "@/components/home/services-preview";
import { AboutPreview } from "@/components/home/about-preview";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { CtaBand } from "@/components/home/cta-band";
import { BusinessJsonLd } from "@/components/seo/structured-data";

// Revalidate the homepage periodically (ISR) for fast, mostly-static delivery.
export const revalidate = 300;

export default async function HomePage() {
  const [settings, featured, categories, services, testimonials] =
    await Promise.all([
      getSettings(),
      getFeaturedPhotos(9),
      getCategoriesWithCounts(),
      getActiveServices(),
      getPublishedTestimonials(),
    ]);

  return (
    <>
      <BusinessJsonLd settings={settings} />
      <Hero settings={settings} />
      <FeaturedWork photos={featured} />
      <CategoryShowcase categories={categories} />
      <ServicesPreview services={services} />
      <AboutPreview settings={settings} />
      <TestimonialsSection testimonials={testimonials} />
      <CtaBand settings={settings} />
    </>
  );
}
