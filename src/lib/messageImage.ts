export const MESSAGE_IMAGE_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const MESSAGE_IMAGE_MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MESSAGE_IMAGE_TARGET_BYTES = 1.4 * 1024 * 1024;
const MESSAGE_IMAGE_MAX_DIMENSION = 1600;
const COMPRESSIBLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface PreparedMessageImage {
  file: File;
  compressed: boolean;
  originalSize: number;
}

function extensionForType(type: string): string {
  if (type === "image/webp") return "webp";
  if (type === "image/png") return "png";
  return "jpg";
}

function formatFileName(name: string, type: string): string {
  const base = name.replace(/\.[^.]+$/, "") || "message-image";
  return `${base}.${extensionForType(type)}`;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Görsel hazırlanamadı."));
      },
      type,
      quality
    );
  });
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Görsel okunamadı."));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function formatImageSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function prepareMessageImage(file: File): Promise<PreparedMessageImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Yalnızca görsel dosyaları gönderilebilir.");
  }

  if (file.type === "image/gif" || !COMPRESSIBLE_TYPES.has(file.type)) {
    if (file.size > MESSAGE_IMAGE_MAX_UPLOAD_BYTES) {
      throw new Error("Bu görsel 5 MB'dan küçük olmalıdır.");
    }
    return { file, compressed: false, originalSize: file.size };
  }

  if (file.size > MESSAGE_IMAGE_MAX_SOURCE_BYTES) {
    throw new Error("Bu görsel çok büyük. Lütfen daha küçük bir görsel seçin.");
  }

  if (file.size <= MESSAGE_IMAGE_TARGET_BYTES) {
    return { file, compressed: false, originalSize: file.size };
  }

  const bitmap = await loadBitmap(file);
  const scale = Math.min(
    1,
    MESSAGE_IMAGE_MAX_DIMENSION / bitmap.width,
    MESSAGE_IMAGE_MAX_DIMENSION / bitmap.height
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Görsel hazırlanamadı.");

  ctx.drawImage(bitmap, 0, 0, width, height);
  if ("close" in bitmap && typeof bitmap.close === "function") {
    bitmap.close();
  }

  const outputType = file.type === "image/png" ? "image/webp" : file.type;
  const qualities = [0.82, 0.72, 0.62, 0.52];
  let bestBlob: Blob | null = null;

  for (const quality of qualities) {
    const blob = await canvasToBlob(canvas, outputType, quality);
    bestBlob = blob;
    if (blob.size <= MESSAGE_IMAGE_TARGET_BYTES) break;
  }

  if (!bestBlob) {
    return { file, compressed: false, originalSize: file.size };
  }

  if (
    bestBlob.size >= file.size &&
    file.size <= MESSAGE_IMAGE_MAX_UPLOAD_BYTES
  ) {
    return { file, compressed: false, originalSize: file.size };
  }

  if (bestBlob.size > MESSAGE_IMAGE_MAX_UPLOAD_BYTES) {
    throw new Error("Görsel sıkıştırıldı ama hâlâ 5 MB'dan büyük.");
  }

  return {
    file: new File([bestBlob], formatFileName(file.name, outputType), {
      type: outputType,
      lastModified: Date.now(),
    }),
    compressed: true,
    originalSize: file.size,
  };
}
