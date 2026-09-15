import axios from "axios";

import api from "./api";
import type { TutorStudentMaterial } from "@/types/api";

/**
 * Tutor material upload: intent -> resumable upload straight to storage ->
 * complete.
 *
 * Files up to 50 MB used to travel browser -> Railway -> Supabase inside one
 * multipart request, which a slow connection or storage3's 20 s timeout could
 * not carry. Now the backend only authorises (`upload-intent`) and verifies
 * (`complete`); the bytes go directly to Supabase over TUS in 6 MB chunks,
 * and a dropped connection resumes instead of starting over.
 */

export interface ResumableUploadTarget {
  endpoint: string;
  token: string;
  bucket: string;
  object_path: string;
  content_type: string;
  chunk_size: number;
}

type UploadIntentResponse =
  | { upload_mode: "proxy" }
  | { upload_mode: "resumable"; material: TutorStudentMaterial; upload: ResumableUploadTarget };

type ProgressCallback = (percent: number) => void;

// Retries while tus reconnects after a dropped network (ms between attempts).
const RESUMABLE_RETRY_DELAYS = [0, 1000, 3000, 5000, 10000, 20000];
// Storage metadata can trail the final chunk by a moment.
const COMPLETE_RETRY_DELAYS = [500, 1000, 2000, 4000];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function toPercent(loaded: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((loaded / total) * 100));
}

export async function uploadMaterialDirect(
  target: ResumableUploadTarget,
  file: File,
  onProgress?: ProgressCallback
): Promise<void> {
  const { Upload } = await import("tus-js-client");
  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: target.endpoint,
      retryDelays: RESUMABLE_RETRY_DELAYS,
      chunkSize: target.chunk_size,
      uploadDataDuringCreation: true,
      // Each intent issues a fresh object path and token, so an upload can
      // only resume within this call; storing fingerprints would only leak.
      storeFingerprintForResuming: false,
      removeFingerprintOnSuccess: true,
      headers: { "x-signature": target.token, "x-upsert": "false" },
      metadata: {
        bucketName: target.bucket,
        objectName: target.object_path,
        contentType: target.content_type,
        cacheControl: "3600",
      },
      onProgress: (bytesUploaded, bytesTotal) => onProgress?.(toPercent(bytesUploaded, bytesTotal)),
      onSuccess: () => resolve(),
      onError: (error) => reject(error),
    });
    upload.start();
  });
}

async function completeMaterialUpload(materialId: string): Promise<TutorStudentMaterial> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const { data } = await api.post<TutorStudentMaterial>(
        `/notifications/tutor-student-materials/${materialId}/complete/`
      );
      return data;
    } catch (error) {
      const incomplete =
        axios.isAxiosError(error) &&
        error.response?.status === 409 &&
        (error.response.data as { code?: string } | undefined)?.code === "upload_incomplete";
      if (!incomplete || attempt >= COMPLETE_RETRY_DELAYS.length) throw error;
      await wait(COMPLETE_RETRY_DELAYS[attempt]);
    }
  }
}

async function uploadMaterialThroughBackend(
  studentId: string,
  file: File,
  onProgress?: ProgressCallback
): Promise<TutorStudentMaterial> {
  const formData = new FormData();
  formData.append("student", studentId);
  formData.append("file", file);
  const { data } = await api.post<TutorStudentMaterial>("/notifications/tutor-student-materials/", formData, {
    headers: { "Content-Type": undefined },
    onUploadProgress: (event) => {
      if (event.total) onProgress?.(toPercent(event.loaded, event.total));
    },
  });
  return data;
}

export async function uploadTutorStudentMaterialFile(
  studentId: string,
  file: File,
  onProgress?: ProgressCallback
): Promise<TutorStudentMaterial> {
  const { data: intent } = await api.post<UploadIntentResponse>(
    "/notifications/tutor-student-materials/upload-intent/",
    { student: studentId, file_name: file.name, size: file.size }
  );
  if (intent.upload_mode === "proxy") {
    // Local development without Supabase credentials.
    return uploadMaterialThroughBackend(studentId, file, onProgress);
  }
  try {
    await uploadMaterialDirect(intent.upload, file, onProgress);
  } catch (error) {
    throw new MaterialStorageUploadError(error);
  }
  return completeMaterialUpload(intent.material.id);
}

/** The direct browser -> storage leg failed (network or storage refused). */
export class MaterialStorageUploadError extends Error {
  readonly cause: unknown;

  constructor(cause: unknown) {
    super("Material storage upload failed");
    this.name = "MaterialStorageUploadError";
    this.cause = cause;
  }
}
