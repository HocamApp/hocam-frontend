import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

import api, { SESSION_EXPIRED_EVENT } from "@/lib/api";

const originalAdapter = api.defaults.adapter;

/** Answers every request with 200 and records the config the interceptors built. */
function captureConfig(): { seen: InternalAxiosRequestConfig | null } {
  const box: { seen: InternalAxiosRequestConfig | null } = { seen: null };
  api.defaults.adapter = async (config) => {
    box.seen = config;
    return { data: {}, status: 200, statusText: "OK", headers: {}, config };
  };
  return box;
}

afterEach(() => {
  api.defaults.adapter = originalAdapter;
  Cookies.remove("auth_token");
});

test("an ordinary request carries the default timeout", async () => {
  const captured = captureConfig();

  await api.get("/tutors/");

  assert.equal(captured.seen?.timeout, 45_000);
});

test("a multipart upload is left unbounded", async () => {
  const captured = captureConfig();
  const body = new FormData();
  body.append("file", "pretend-bytes");

  await api.post("/tutors/me/verification/", body);

  // Bandwidth, not server work, decides how long an upload runs. A bound here
  // would cut a large attachment off mid-flight.
  assert.ok(!captured.seen?.timeout, "upload must not inherit the default timeout");
});

test("a timeout the caller asks for wins over the default", async () => {
  const captured = captureConfig();

  await api.get("/matching/preview/", { timeout: 15_000 });

  assert.equal(captured.seen?.timeout, 15_000);
});

test("a caller that asks for no timeout at all keeps none", async () => {
  const captured = captureConfig();

  // 0 is axios's "unbounded". It must survive: an interceptor that lifts every
  // falsy timeout would read this as "nobody chose" and bound it anyway.
  await api.get("/bookings/", { timeout: 0 });

  assert.equal(captured.seen?.timeout, 0);
});

test("an upload the caller timed itself keeps that timeout", async () => {
  const captured = captureConfig();
  const body = new FormData();
  body.append("file", "pretend-bytes");

  await api.post("/messages/", body, { timeout: 90_000 });

  assert.equal(captured.seen?.timeout, 90_000);
});

test("an absent per-call timeout still gets the default", async () => {
  const captured = captureConfig();

  // matchingApi passes `timeout: options.timeoutMs`, which is undefined when
  // the caller gives no options. That must not read as "no timeout wanted".
  await api.post("/matching/preview/", {}, { timeout: undefined });

  assert.equal(captured.seen?.timeout, 45_000);
});

test("a timed-out request rejects without touching the session", async () => {
  Cookies.set("auth_token", "token-123");
  const expiries: Event[] = [];
  const listener = (event: Event) => expiries.push(event);
  window.addEventListener(SESSION_EXPIRED_EVENT, listener);

  api.defaults.adapter = async (config) =>
    Promise.reject(
      new AxiosError(
        `timeout of ${config.timeout}ms exceeded`,
        AxiosError.ECONNABORTED,
        config
      )
    );

  await assert.rejects(
    api.get("/bookings/"),
    (error: AxiosError) => {
      assert.equal(error.code, "ECONNABORTED");
      return true;
    }
  );

  // A timeout carries no response, so none of the interceptor's status-driven
  // branches fire: the login stays, and no expiry dialog is summoned.
  assert.equal(Cookies.get("auth_token"), "token-123");
  assert.equal(expiries.length, 0);

  window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
});
