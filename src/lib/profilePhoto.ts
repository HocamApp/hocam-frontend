export const PROFILE_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";
export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_PHOTO_RULE_TEXT =
  "Profil fotoğrafında telefon numarası, sosyal medya hesabı veya iletişim bilgisi bulunamaz.";
export const TUTOR_REAL_PHOTO_RULE_TEXT =
  "Hoca profillerinde gerçek profil fotoğrafı gereklidir.";

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
