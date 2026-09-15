import { cn } from "@/lib/utils";

/** Inner-page header. Extra top padding clears the fixed navbar. */
export function PageHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <section className={cn("bg-cream/60", className)}>
      <div className="container pb-14 pt-28 text-center md:pb-20 md:pt-36">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
