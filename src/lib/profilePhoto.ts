export const PROFILE_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";
export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_PHOTO_RULE_TEXT =
  "Profil fotoğrafında telefon numarası, sosyal medya hesabı veya iletişim bilgisi bulunamaz.";
export const TUTOR_REAL_PHOTO_RULE_TEXT =
  "Hocalar herkese açık profilde gerçek profil fotoğrafı kullanmalıdır.";

const PROFILE_PHOTO_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function validateProfilePhotoFile(file: File): string | null {
  if (!PROFILE_PHOTO_ALLOWED_TYPES.has(file.type)) {
    return "Yalnızca JPEG, PNG veya WebP görseller yüklenebilir.";
  }

  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    return "Fotoğraf 5 MB veya daha küçük olmalıdır.";
  }

  return null;
}
