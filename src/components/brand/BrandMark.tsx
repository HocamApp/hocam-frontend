import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandMarkSize = "sm" | "md" | "hero";

const markSizes: Record<BrandMarkSize, string> = {
  sm: "size-9",
  md: "size-12",
  hero: "size-48",
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
          "relative block shrink-0 overflow-hidden",
          markSizes[size]
        )}
      >
        <Image
          src="/brand/hocam-logo.png"
          alt=""
          aria-hidden="true"
          width={1024}
          height={1024}
          priority={priority}
          sizes={size === "hero" ? "192px" : "48px"}
          className="size-full scale-[1.45] object-contain"
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
