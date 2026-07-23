"use client";

import { Check } from "lucide-react";

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
        className="w-full max-w-sm rounded-xl border border-white/10 bg-gray-900 p-4 text-white shadow-2xl"
      >
        <h3 className="text-sm font-semibold">Görüntü ayarı</h3>
        <p className="mt-1 text-xs text-gray-400">
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
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                  isSelected
                    ? "border-sky-500 bg-sky-500/15 text-white"
                    : "border-white/10 text-gray-200 hover:bg-white/5"
                }`}
              >
                <span>
                  <span className="block font-medium">{option.label}</span>
                  {option.description && (
                    <span className="mt-0.5 block text-[11px] text-amber-300">
                      {option.description}
                    </span>
                  )}
                </span>
                {isSelected && (
                  <Check className="h-4 w-4 shrink-0 text-sky-300" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-gray-200 transition-colors hover:bg-white/10"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
