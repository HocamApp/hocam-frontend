"use client";

import { type RefObject } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  getVideoQualityOption,
  VIDEO_QUALITY_LEVELS,
  type VideoQualityLevel,
} from "@/lib/jitsiSessionControls";

interface VideoQualityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The level currently shown as selected (pending until Jitsi confirms). */
  selectedLevel: VideoQualityLevel;
  isApplying: boolean;
  hasError: boolean;
  roomReady: boolean;
  onSelectLevel: (level: VideoQualityLevel) => void;
  triggerRef?: RefObject<HTMLButtonElement>;
}

const LEVEL_INDEX = (level: VideoQualityLevel) =>
  VIDEO_QUALITY_LEVELS.findIndex((o) => o.level === level);

/**
 * Four-level Turkish video-quality modal driven by a slider (arrow keys /
 * Home / End). The audio-only level's camera warning is wired to the option's
 * description so screen readers announce it with the selection.
 */
export function VideoQualityDialog({
  open,
  onOpenChange,
  selectedLevel,
  isApplying,
  hasError,
  roomReady,
  onSelectLevel,
  triggerRef,
}: VideoQualityDialogProps) {
  const selectedIndex = Math.max(0, LEVEL_INDEX(selectedLevel));
  const selectedOption = getVideoQualityOption(selectedLevel);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100dvw-2rem)] max-w-md rounded-xl"
        onCloseAutoFocus={(event) => {
          if (triggerRef?.current) {
            event.preventDefault();
            triggerRef.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Görüntü ayarı</DialogTitle>
          <DialogDescription>
            Bağlantına göre görüntü kalitesini ayarla.
          </DialogDescription>
        </DialogHeader>

        {!roomReady ? (
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Ders odası hazır olduğunda görüntü ayarını değiştirebilirsin.
          </p>
        ) : (
          <div className="space-y-4">
            <Slider
              aria-label="Görüntü kalitesi seviyesi"
              min={0}
              max={VIDEO_QUALITY_LEVELS.length - 1}
              step={1}
              value={[selectedIndex]}
              onValueChange={([index]) =>
                onSelectLevel(VIDEO_QUALITY_LEVELS[index].level)
              }
              disabled={isApplying}
            />
            <div className="flex justify-between gap-1 text-[11px] text-muted-foreground">
              {VIDEO_QUALITY_LEVELS.map((option) => (
                <span
                  key={option.level}
                  className={`flex-1 text-center leading-tight ${
                    option.level === selectedLevel
                      ? "font-medium text-foreground"
                      : ""
                  }`}
                >
                  {option.label}
                </span>
              ))}
            </div>

            {/* Live selection + camera warning, announced together. */}
            <p className="min-h-[1.25rem] text-sm" aria-live="polite">
              <span className="font-medium">{selectedOption.label}</span>
              {selectedOption.description && (
                <span className="ml-1 text-amber-600 dark:text-amber-400">
                  {selectedOption.description}
                </span>
              )}
            </p>

            <div className="min-h-[1.25rem] text-xs" aria-live="polite">
              {isApplying && (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Görüntü ayarı uygulanıyor…
                </span>
              )}
              {hasError && !isApplying && (
                <span className="text-destructive">
                  Görüntü ayarı uygulanamadı. Lütfen tekrar dene.
                </span>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
