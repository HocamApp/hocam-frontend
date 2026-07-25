export const PROFILE_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";
export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_PHOTO_RULE_TEXT =
  "Profil fotoğrafında telefon numarası, sosyal medya hesabı veya iletişim bilgisi bulunamaz.";
export const TUTOR_REAL_PHOTO_RULE_TEXT =
  "Hoca profillerinde gerçek profil fotoğrafı gereklidir.";

// Crop pipeline constants (AvatarEditor + ProfilePhotoCropper). The output
// is always re-encoded to a fixed square canvas, so these are separate from
// PROFILE_PHOTO_MAX_BYTES above (which still gates the two upload paths
// that don't crop — dashboard/tutor/page.tsx's inline widget and the tutor
// onboarding wizard — and, here, gates the *cropped output* instead of the
// raw upload).
//
// 512px reasoning: today's display is a 64px circle (TutorCard), the
// planned card redesign is "~2x larger" (~128px CSS). Common device pixel
// ratios top out around 3x, so 128 * 3 = 384px is the real floor for a
// crisp render at that future size — 512 rounds that up to a standard,
// clean avatar-export size with headroom past "~2x" specifically.
export const PROFILE_PHOTO_CROP_OUTPUT_SIZE = 512;
export const PROFILE_PHOTO_MIN_SOURCE_DIMENSION = 512;
// Raw-upload ceiling before crop — generous (a typical modern phone camera
// JPEG is well under this) since it only guards against decoding a
// pathologically huge file into memory, not the stored asset size; the
// cropped output is what's checked against PROFILE_PHOTO_MAX_BYTES.
export const PROFILE_PHOTO_MAX_SOURCE_BYTES = 20 * 1024 * 1024;

const PROFILE_PHOTO_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function validateProfilePhotoFile(file: File): string | null {
  if (!PROFILE_PHOTO_ALLOWED_TYPES.has(file.type)) {
    return "Lütfen JPG, PNG veya WebP formatında bir görsel yükle.";
  }

  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    return "Profil fotoğrafı en fazla 5 MB olabilir.";
  }

  return null;
}

/** Pre-crop gate on the raw file the user picked, before it's ever decoded
 * into an <img>/canvas — MIME type + a generous size ceiling. Minimum
 * resolution is checked separately (async, needs the image decoded first)
 * via checkProfilePhotoMinResolution. */
export function validateProfilePhotoSourceFile(file: File): string | null {
  if (!PROFILE_PHOTO_ALLOWED_TYPES.has(file.type)) {
    return "Lütfen JPG, PNG veya WebP formatında bir görsel yükle.";
  }

  if (file.size > PROFILE_PHOTO_MAX_SOURCE_BYTES) {
    return "Fotoğraf en fazla 20 MB olabilir.";
  }

  return null;
}

// How far past 1:1 the crop tool lets someone zoom, regardless of how much
// bigger the source is than the minimum — an arbitrarily large source
// shouldn't translate into an unbounded/unwieldy zoom range in the UI.
const PROFILE_PHOTO_MAX_ZOOM_CEILING = 5;

/** Loads the file just far enough to read its pixel dimensions, checks them
 * against PROFILE_PHOTO_MIN_SOURCE_DIMENSION, and derives the cropper's
 * maxZoom from how much bigger the source is than the output — so the
 * crop tool physically can't select a region that would need upscaling
 * past the source's real resolution. Returns an object URL for the caller
 * to reuse in the cropper on success (avoids decoding the image twice) —
 * the caller owns revoking it. */
export function checkProfilePhotoMinResolution(
  file: File
): Promise<
  | { ok: true; objectUrl: string; maxZoom: number }
  | { ok: false; error: string }
> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const smallestSide = Math.min(image.naturalWidth, image.naturalHeight);
      if (smallestSide < PROFILE_PHOTO_MIN_SOURCE_DIMENSION) {
        URL.revokeObjectURL(objectUrl);
        resolve({
          ok: false,
          error: `Fotoğraf en az ${PROFILE_PHOTO_MIN_SOURCE_DIMENSION}×${PROFILE_PHOTO_MIN_SOURCE_DIMENSION} piksel olmalı. Lütfen daha yüksek çözünürlüklü bir fotoğraf seç.`,
        });
        return;
      }
      const maxZoom = Math.min(
        PROFILE_PHOTO_MAX_ZOOM_CEILING,
        smallestSide / PROFILE_PHOTO_CROP_OUTPUT_SIZE
      );
      resolve({ ok: true, objectUrl, maxZoom });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ ok: false, error: "Görsel okunamadı. Lütfen başka bir dosya dene." });
    };
    image.src = objectUrl;
  });
}

export interface CropPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Draws the selected crop region onto a fixed PROFILE_PHOTO_CROP_OUTPUT_SIZE
 * square canvas and re-encodes it as JPEG — every cropped upload ends up the
 * same pixel dimensions and roughly the same (small) file size regardless of
 * the source photo, so PROFILE_PHOTO_MAX_BYTES is checked here as a safety
 * net rather than something a real photo could plausibly hit. */
export function getCroppedProfilePhotoFile(
  imageSrc: string,
  cropPixels: CropPixels
): Promise<{ ok: true; file: File } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = PROFILE_PHOTO_CROP_OUTPUT_SIZE;
      canvas.height = PROFILE_PHOTO_CROP_OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ ok: false, error: "Fotoğraf kırpılamadı. Lütfen tekrar deneyin." });
        return;
      }
      ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        PROFILE_PHOTO_CROP_OUTPUT_SIZE,
        PROFILE_PHOTO_CROP_OUTPUT_SIZE
      );
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ ok: false, error: "Fotoğraf kırpılamadı. Lütfen tekrar deneyin." });
            return;
          }
          if (blob.size > PROFILE_PHOTO_MAX_BYTES) {
            resolve({ ok: false, error: "Profil fotoğrafı en fazla 5 MB olabilir." });
            return;
          }
          resolve({
            ok: true,
            file: new File([blob], "avatar.jpg", { type: "image/jpeg" }),
          });
        },
        "image/jpeg",
        0.9
      );
    };
    image.onerror = () => {
      resolve({ ok: false, error: "Fotoğraf kırpılamadı. Lütfen tekrar deneyin." });
    };
    image.src = imageSrc;
  });
}
