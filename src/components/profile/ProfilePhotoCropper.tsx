"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  getCroppedProfilePhotoFile,
  PROFILE_PHOTO_MIN_SOURCE_DIMENSION,
} from "@/lib/profilePhoto";

interface ProfilePhotoCropperProps {
  open: boolean;
  imageSrc: string;
  /** min(naturalWidth, naturalHeight) / PROFILE_PHOTO_CROP_OUTPUT_SIZE,
   * clamped — the most the user can zoom in before the selected region
   * would need upscaling past what the source actually has. At exactly
   * PROFILE_PHOTO_MIN_SOURCE_DIMENSION this is 1 (no zoom: the full image
   * is the only crop that doesn't upscale). */
  maxZoom: number;
  onCancel: () => void;
  onCropped: (file: File) => void;
}

/** Square-only crop (aspect 1, rect mask — not "round," even though the
 * result currently only ever displays in a circle): the same asset needs to
 * work as today's 64px circle (TutorCard) and a future square/portrait
 * card image, and a round mask here would hide corners in the preview that
 * the square output actually keeps, misleading tutors about what a future
 * square rendering will show. */
export function ProfilePhotoCropper({
  open,
  imageSrc,
  maxZoom,
  onCancel,
  onCropped,
}: ProfilePhotoCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    setError(null);
    const result = await getCroppedProfilePhotoFile(imageSrc, croppedAreaPixels);
    setIsProcessing(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCropped(result.file);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="w-[calc(100dvw-1rem)] max-w-[calc(100dvw-1rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fotoğrafı kırp</DialogTitle>
          <DialogDescription>
            Kare alanı sürükleyip yakınlaştırarak fotoğrafının nasıl görüneceğini ayarla.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-72 w-full overflow-hidden rounded-md bg-muted">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            minZoom={1}
            maxZoom={Math.max(1, maxZoom)}
            restrictPosition
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
          />
        </div>

        <div className="space-y-2 py-1">
          <span className="text-xs text-muted-foreground">Yakınlaştır</span>
          <Slider
            aria-label="Yakınlaştırma seviyesi"
            min={1}
            max={Math.max(1, maxZoom)}
            step={0.05}
            value={[zoom]}
            onValueChange={([value]) => setZoom(value)}
            disabled={maxZoom <= 1}
          />
          {maxZoom <= 1 && (
            <p className="text-xs text-muted-foreground">
              Bu fotoğraf tam {PROFILE_PHOTO_MIN_SOURCE_DIMENSION}×
              {PROFILE_PHOTO_MIN_SOURCE_DIMENSION} piksel — netliği korumak için
              yakınlaştırma kapalı.
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Vazgeç
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing || !croppedAreaPixels}>
            {isProcessing ? "İşleniyor…" : "Kırp ve devam et"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
