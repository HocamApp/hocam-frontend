import { cn } from "@/lib/utils";

export const SENSITIVE_DATA_GUIDANCE =
  "Lütfen sağlık bilgisi, T.C. kimlik numarası veya gereksiz kişisel bilgi paylaşmayın.";

export function SensitiveDataGuidance({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-5 text-muted-foreground", className)}>
      {SENSITIVE_DATA_GUIDANCE}
    </p>
  );
}
