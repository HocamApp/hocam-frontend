import axios from "axios";

/**
 * Turkish copy for a failed file upload, chosen from the backend's `code`.
 *
 * Every photo upload used to collapse into "Fotoğraf yüklenemedi. Lütfen
 * tekrar deneyin." — including the week-long outages where the storage
 * project was paused and retrying could not help. The backend now answers
 * with a machine-readable `code`; this maps it so the message says what
 * actually happened and whether trying again makes sense.
 */
export const STORAGE_UNAVAILABLE_MESSAGE =
  "Dosya yükleme şu an geçici olarak kullanılamıyor. Birkaç dakika sonra tekrar dene.";
const THROTTLED_MESSAGE = "Kısa sürede çok fazla yükleme denedin. Bir dakika sonra tekrar dene.";
const NETWORK_MESSAGE = "Bağlantı kurulamadı. İnternet bağlantını kontrol edip tekrar dene.";

export type UploadErrorKind =
  | "storage_unavailable"
  | "unsupported_file_type"
  | "file_too_large"
  | "throttled"
  | "network"
  | "invalid_file"
  | "unknown";

export function getUploadErrorKind(error: unknown): UploadErrorKind {
  if (!axios.isAxiosError(error)) return "unknown";
  if (!error.response) return "network";
  const code = (error.response.data as { code?: unknown } | undefined)?.code;
  if (
    code === "storage_unavailable" ||
    code === "unsupported_file_type" ||
    code === "file_too_large" ||
    code === "invalid_file"
  ) {
    return code;
  }
  if (error.response.status === 429) return "throttled";
  if (error.response.status === 503) return "storage_unavailable";
  if (error.response.status === 413) return "file_too_large";
  return "unknown";
}

export function getPhotoUploadErrorMessage(error: unknown): string {
  switch (getUploadErrorKind(error)) {
    case "storage_unavailable":
      return STORAGE_UNAVAILABLE_MESSAGE;
    case "unsupported_file_type":
      return "Bu dosya geçerli bir JPG, PNG veya WebP görsel değil. Başka bir fotoğraf seç.";
    case "file_too_large":
      return "Profil fotoğrafı en fazla 5 MB olabilir.";
    case "throttled":
      return THROTTLED_MESSAGE;
    case "network":
      return NETWORK_MESSAGE;
    default:
      return "Fotoğraf yüklenemedi. Lütfen tekrar dene.";
  }
}

export function getMaterialUploadErrorMessage(error: unknown): string {
  if (error instanceof Error && error.name === "MaterialStorageUploadError") {
    return "Dosya yüklenirken bağlantı koptu. İnternet bağlantını kontrol edip tekrar dene.";
  }
  const kind = getUploadErrorKind(error);
  if (kind === "storage_unavailable") return STORAGE_UNAVAILABLE_MESSAGE;
  if (kind === "throttled") return THROTTLED_MESSAGE;
  if (kind === "network") return NETWORK_MESSAGE;
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { file?: unknown; student?: unknown; detail?: unknown }
      | undefined;
    const fileError = Array.isArray(data?.file) ? data.file[0] : undefined;
    const studentError = Array.isArray(data?.student) ? data.student[0] : undefined;
    const detail = typeof data?.detail === "string" ? data.detail : undefined;
    const specific = fileError || studentError || detail;
    if (typeof specific === "string" && specific) return specific;
  }
  return "Materyal yüklenemedi. Lütfen tekrar dene.";
}
