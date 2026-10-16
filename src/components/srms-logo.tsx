import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * SRMS Events brand logo: the SRMS crest (which already reads "SRMS")
 * followed by a light "Events" wordmark so the lockup reads "SRMS Events".
 * Use `variant="light"` on dark backgrounds (renders the wordmark in white
 * and puts the crest on a white rounded chip).
 */
export default function SrmsLogo({
  variant = "dark",
  className,
  imageSize = 40,
  textSize = "text-2xl",
}: {
  variant?: "dark" | "light";
  className?: string;
  imageSize?: number;
  textSize?: string;
}) {
  const light = variant === "light";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/srms-logo.png"
        alt="SRMS"
        width={imageSize * 3}
        height={imageSize}
        priority
        className={cn(
          "h-10 w-auto object-contain",
          light && "bg-white rounded-md p-0.5"
        )}
      />
      <span
        className={cn(
          "font-light tracking-tight leading-none",
          textSize,
          light ? "text-white" : "text-maroon"
        )}
      >
        Events
      </span>
    </span>
  );
}
