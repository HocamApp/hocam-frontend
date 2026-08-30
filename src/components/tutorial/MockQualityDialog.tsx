"use client";

import { Check } from "@phosphor-icons/react";

import {
  VIDEO_QUALITY_LEVELS,
  VideoQualityLevel,
} from "@/lib/jitsiSessionControls";

interface MockQualityDialogProps {
  open: boolean;
  selected: VideoQualityLevel;
  onSelect: (level: VideoQualityLevel) => void;
  onClose: () => void;
}

/**
 * Replica of VideoQualityDialog for the tutorial. Reuses the real
 * VIDEO_QUALITY_LEVELS data (safe pure import — no Jitsi commands are sent)
 * so labels and the "kameranı kapatır" warning always match the live lesson.
 */
export function MockQualityDialog({
  open,
  selected,
  onSelect,
  onClose,
}: MockQualityDialogProps) {
  if (!open) return null;
  return (
    // Above the tutorial card (z-[70]): while this mock dialog is open it is
    // the active surface, exactly like a real modal.
    <div className="pointer-events-auto fixed inset-0 z-[75] flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Görüntü ayarı (temsilî)"
        className="w-full max-w-sm rounded-modal border border-line bg-surface p-6 text-ink shadow-float"
      >
        <h3 className="text-xl font-bold tracking-[-0.02em]">Görüntü ayarı</h3>
        <p className="mt-1 text-sm leading-6 text-ink-mid">
          Performans ve görüntü kalitesi arasındaki dengeyi seç.
        </p>
        <div className="mt-3 space-y-1.5">
          {VIDEO_QUALITY_LEVELS.map((option) => {
            const isSelected = option.level === selected;
            return (
              <button
                key={option.level}
                type="button"
                onClick={() => onSelect(option.level)}
                className={`flex w-full items-center justify-between rounded-input border px-3 py-2.5 text-left text-xs transition-colors duration-[var(--duration-state)] ${
                  isSelected
                    ? "border-pink bg-pink text-white"
                    : "border-line bg-surface text-ink hover:bg-paper"
                }`}
              >
                <span>
                  <span className="block font-medium">{option.label}</span>
                  {option.description && (
                    <span className={`mt-0.5 block text-[11px] ${isSelected ? "text-white" : "text-error"}`}>
                      {option.description}
                    </span>
                  )}
                </span>
                {isSelected && (
                  <Check className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-pill border border-ink px-5 text-xs font-medium text-ink transition-colors duration-[var(--duration-state)] hover:bg-ink hover:text-paper"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
