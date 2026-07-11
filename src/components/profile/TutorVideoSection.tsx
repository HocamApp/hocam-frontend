"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getYouTubeEmbedUrl } from "@/lib/videoUrl";

interface TutorVideoSectionProps {
  introVideoUrl: string;
  fullName: string;
  onSave: (url: string) => Promise<void>;
}

export function TutorVideoSection({
  introVideoUrl,
  fullName,
  onSave,
}: TutorVideoSectionProps) {
  const [inputValue, setInputValue] = useState(introVideoUrl);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const embedUrl = getYouTubeEmbedUrl(introVideoUrl);
  const hasVideo = Boolean(embedUrl);

  const handleSave = async () => {
    const trimmed = inputValue.trim();
    if (trimmed && !getYouTubeEmbedUrl(trimmed)) {
      setError("Lütfen geçerli bir YouTube video bağlantısı gir.");
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
    } catch {
      setError("Video kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await onSave("");
      setInputValue("");
    } catch {
      setError("Video kaldırılamadı. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-medium text-foreground">Tanıtım videosu</p>
        <p className="text-sm text-muted-foreground">
          Öğrencilerin seni daha yakından tanıması için profilinde kısa bir
          tanıtım videosu gösterebilirsin.
        </p>
      </div>

      {hasVideo && (
        <div className="mb-3 aspect-video overflow-hidden rounded-lg border border-border bg-muted">
          <iframe
            className="h-full w-full"
            src={embedUrl ?? undefined}
            title={`${fullName} tanıtım videosu`}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}

      {!hasVideo && (
        <div className="mb-3 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
          <PlayCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Henüz bir tanıtım videon yok.</p>
        </div>
      )}

      <Accordion type="single" collapsible>
        <AccordionItem value="video-editor" className="border-none">
          <AccordionTrigger className="justify-start gap-2 rounded-md py-1 text-sm font-medium text-foreground hover:no-underline">
            {hasVideo ? "Videoyu düzenle" : "Tanıtım videosu ekle"}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
              <Input
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError(null);
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                aria-label="Tanıtım videosu bağlantısı"
              />
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
                  Kaydet
                </Button>
                {hasVideo && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleRemove}
                    disabled={saving}
                  >
                    Videoyu kaldır
                  </Button>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
