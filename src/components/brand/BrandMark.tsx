import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandMarkSize = "sm" | "md" | "hero";

const markSizes: Record<BrandMarkSize, string> = {
  sm: "h-9 w-8 rounded-lg",
  md: "h-12 w-10 rounded-xl",
  hero: "h-48 w-40 rounded-[2rem]",
};

const nameSizes: Record<BrandMarkSize, string> = {
  sm: "text-xl",
  md: "text-2xl",
  hero: "text-5xl sm:text-6xl",
};

export function BrandMark({
  size = "sm",
  showName = true,
  priority = false,
  className,
}: {
  size?: BrandMarkSize;
  showName?: boolean;
  priority?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative block shrink-0 overflow-hidden border border-[#ff5968]/15 bg-[#f5f3ee] shadow-sm",
          markSizes[size]
        )}
      >
        <Image
          src="/brand/hocam-logo.jpeg"
          alt=""
          aria-hidden="true"
          width={1600}
          height={1200}
          priority={priority}
          sizes={size === "hero" ? "160px" : "48px"}
          className="absolute left-1/2 top-0 h-full w-auto max-w-none -translate-x-1/2"
        />
      </span>
      {showName ? (
        <span className={cn("font-bold tracking-[-0.035em]", nameSizes[size])}>
          Hocam
        </span>
      ) : null}
    </span>
  );
}

