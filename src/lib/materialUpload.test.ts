import assert from "node:assert/strict";
import { beforeEach, mock, test } from "node:test";
import { AxiosError, AxiosHeaders } from "axios";

type Post = (url: string, body?: unknown) => Promise<{ data: unknown }>;
type TusOptions = Record<string, unknown> & {
  onProgress: (loaded: number, total: number) => void;
  onSuccess: () => void;
  onError: (error: Error) => void;
};

// Modules are cached after the first import, so each dependency is mocked once
// and every test swaps the behaviour behind it.
const state: { post: Post; tusFails: boolean; tusOptions: TusOptions[] } = {
  post: async () => ({ data: null }),
  tusFails: false,
  tusOptions: [],
};

mock.module("./api", {
  defaultExport: { post: (url: string, body?: unknown) => state.post(url, body) },
});

class FakeUpload {
  constructor(_file: File, private options: TusOptions) {
    state.tusOptions.push(options);
  }
  start() {
    if (state.tusFails) return this.options.onError(new Error("tus: network"));
    this.options.onProgress(3, 6);
    this.options.onProgress(6, 6);
    this.options.onSuccess();
  }
}
mock.module("tus-js-client", { namedExports: { Upload: FakeUpload } });

const target = {
  endpoint: "https://ref.storage.supabase.co/storage/v1/upload/resumable/sign",
  token: "signed-token",
  bucket: "tutor-student-materials",
  object_path: "tutor-student-materials/t/s/m.pdf",
  content_type: "application/pdf",
  chunk_size: 6 * 1024 * 1024,
};

const material = {
  id: "material-1",
  student: "student-1",
  original_name: "soru-bankasi.pdf",
  mime_type: "application/pdf",
  file_extension: "pdf",
  size_bytes: 3,
  created_at: "2026-09-16T10:00:00Z",
};

const resumableIntent = { data: { upload_mode: "resumable", material, upload: target } };

beforeEach(() => {
  state.tusFails = false;
  state.tusOptions = [];
});

test("resumable mode uploads straight to storage with the signed token, then completes", async () => {
  const calls: Array<{ url: string; body?: unknown }> = [];
  state.post = async (url, body) => {
    calls.push({ url, body });
    return url.endsWith("upload-intent/") ? resumableIntent : { data: material };
  };
  const { uploadTutorStudentMaterialFile } = await import("./materialUpload");
  const progress: number[] = [];

  const file = new File(["abc"], "soru-bankasi.pdf", { type: "" });
  const result = await uploadTutorStudentMaterialFile("student-1", file, (p) => progress.push(p));

  assert.equal(result.id, "material-1");
  assert.deepEqual(calls.map((call) => call.url), [
    "/notifications/tutor-student-materials/upload-intent/",
    "/notifications/tutor-student-materials/material-1/complete/",
  ]);
  assert.deepEqual(calls[0].body, { student: "student-1", file_name: "soru-bankasi.pdf", size: 3 });
  assert.deepEqual(progress, [50, 100]);
  const options = state.tusOptions[0] as TusOptions & {
    endpoint: string;
    chunkSize: number;
    headers: Record<string, string>;
    metadata: Record<string, string>;
  };
  assert.equal(options.endpoint, target.endpoint);
  assert.equal(options.chunkSize, target.chunk_size);
  assert.equal(options.headers["x-signature"], "signed-token");
  assert.deepEqual(options.metadata, {
    bucketName: "tutor-student-materials",
    objectName: "tutor-student-materials/t/s/m.pdf",
    contentType: "application/pdf",
    cacheControl: "3600",
  });
});

test("complete is retried while storage reports the upload incomplete", async () => {
  let completes = 0;
  state.post = async (url) => {
    if (url.endsWith("upload-intent/")) return resumableIntent;
    completes += 1;
    if (completes === 1) {
      const config = { headers: new AxiosHeaders() };
      throw new AxiosError("409", "ERR_BAD_REQUEST", config, null, {
        status: 409,
        statusText: "",
        headers: {},
        config,
        data: { code: "upload_incomplete" },
      });
    }
    return { data: material };
  };
  const { uploadTutorStudentMaterialFile } = await import("./materialUpload");
  const result = await uploadTutorStudentMaterialFile("student-1", new File(["abc"], "a.pdf"));
  assert.equal(result.id, "material-1");
  assert.equal(completes, 2);
});

test("a failed storage leg surfaces as a connection error and never calls complete", async () => {
  const urls: string[] = [];
  state.tusFails = true;
  state.post = async (url) => {
    urls.push(url);
    return resumableIntent;
  };
  const { uploadTutorStudentMaterialFile } = await import("./materialUpload");
  const { getMaterialUploadErrorMessage } = await import("./uploadErrors");

  await assert.rejects(
    uploadTutorStudentMaterialFile("student-1", new File(["abc"], "a.pdf")),
    (error: unknown) => {
      assert.match(getMaterialUploadErrorMessage(error), /bağlantı koptu/);
      return true;
    }
  );
  assert.equal(urls.length, 1);
});

test("proxy mode (local dev) falls back to the multipart endpoint", async () => {
  const urls: string[] = [];
  state.post = async (url) => {
    urls.push(url);
    return url.endsWith("upload-intent/") ? { data: { upload_mode: "proxy" } } : { data: material };
  };
  const { uploadTutorStudentMaterialFile } = await import("./materialUpload");
  await uploadTutorStudentMaterialFile("student-1", new File(["abc"], "a.pdf"));
  assert.deepEqual(urls, [
    "/notifications/tutor-student-materials/upload-intent/",
    "/notifications/tutor-student-materials/",
  ]);
  assert.equal(state.tusOptions.length, 0);
});
