import assert from "node:assert/strict";
import test from "node:test";
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";

import {
  STORAGE_UNAVAILABLE_MESSAGE,
  getMaterialUploadErrorMessage,
  getPhotoUploadErrorMessage,
  getUploadErrorKind,
} from "./uploadErrors";

function httpError(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  const response = { status, data, statusText: "", headers: {}, config } as AxiosResponse;
  return new AxiosError("request failed", "ERR_BAD_RESPONSE", config, null, response);
}

test("paused storage (503 storage_unavailable) says it is temporary, not 'try again'", () => {
  const error = httpError(503, { detail: "x", code: "storage_unavailable" });
  assert.equal(getUploadErrorKind(error), "storage_unavailable");
  assert.equal(getPhotoUploadErrorMessage(error), STORAGE_UNAVAILABLE_MESSAGE);
  assert.equal(getMaterialUploadErrorMessage(error), STORAGE_UNAVAILABLE_MESSAGE);
});

test("a bare 503 without a code is still treated as storage outage", () => {
  assert.equal(getPhotoUploadErrorMessage(httpError(503, {})), STORAGE_UNAVAILABLE_MESSAGE);
});

test("photo codes map to specific copy", () => {
  assert.match(
    getPhotoUploadErrorMessage(httpError(400, { code: "unsupported_file_type" })),
    /JPG, PNG veya WebP/
  );
  assert.match(getPhotoUploadErrorMessage(httpError(400, { code: "file_too_large" })), /5 MB/);
  assert.match(getPhotoUploadErrorMessage(httpError(429, {})), /Bir dakika sonra/);
});

test("no response at all is a connection problem", () => {
  const error = new AxiosError("Network Error", "ERR_NETWORK");
  assert.equal(getUploadErrorKind(error), "network");
  assert.match(getPhotoUploadErrorMessage(error), /İnternet bağlantını/);
});

test("material validation messages from the backend are shown as-is", () => {
  const error = httpError(400, { file: ["Dosya 25 MB veya daha küçük olmalı."], code: "invalid_file" });
  assert.equal(getMaterialUploadErrorMessage(error), "Dosya 25 MB veya daha küçük olmalı.");
});

test("non-axios errors fall back to the generic message", () => {
  assert.equal(getPhotoUploadErrorMessage(new Error("x")), "Fotoğraf yüklenemedi. Lütfen tekrar dene.");
});
