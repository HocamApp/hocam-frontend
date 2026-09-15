/**
 * Tutor-private material types. Mirrors TUTOR_MATERIAL_MIME_BY_EXTENSION and
 * TUTOR_MATERIAL_MAX_BYTES in Hocam_backend/apps/notifications/material_validation.py;
 * the backend re-checks size, extension and the stored bytes, so this list
 * only saves the tutor a round trip.
 *
 * 50 MB is the Supabase Free plan's per-file ceiling. YKS question-book PDFs
 * are routinely 30+ MB, which is why the old 25 MB limit rejected them.
 * The type is decided by extension, not `file.type`: browsers on machines
 * without Office report .docx/.pptx with an empty MIME type.
 */
export const TUTOR_MATERIAL_MAX_BYTES = 50 * 1024 * 1024;

export const TUTOR_MATERIAL_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "txt",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "heic",
  "mp3",
  "m4a",
  "wav",
  "mp4",
  "mov",
  "webm",
] as const;

export const TUTOR_MATERIAL_ACCEPT = TUTOR_MATERIAL_EXTENSIONS.map((extension) => `.${extension}`).join(",");

export const TUTOR_MATERIAL_HINT =
  "PDF, Word, PowerPoint, Excel, metin, görsel, ses veya video · En fazla 50 MB";

export const TUTOR_MATERIAL_TYPE_ERROR =
  "PDF, Word, PowerPoint, Excel, metin, görsel, ses veya video dosyası seç.";

export function materialExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot < 0 ? "" : fileName.slice(dot + 1).toLocaleLowerCase("en-US");
}

export function validateTutorMaterialFile(file: File): string | null {
  if (file.size <= 0) return "Boş dosya yüklenemez.";
  if (file.size > TUTOR_MATERIAL_MAX_BYTES) return "Dosya 50 MB veya daha küçük olmalı.";
  const extension = materialExtension(file.name);
  if (!(TUTOR_MATERIAL_EXTENSIONS as readonly string[]).includes(extension)) {
    return TUTOR_MATERIAL_TYPE_ERROR;
  }
  return null;
}
