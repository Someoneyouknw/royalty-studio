import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({
  rating,
  className,
  size = 16,
}: {
  rating: number | null | undefined;
  className?: string;
  size?: number;
}) {
  if (!rating) return null;
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`${rounded} out of 5 stars`}
      role="img"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={cn(
            i < rounded ? "fill-primary text-primary" : "fill-transparent text-muted-foreground/40",
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}
