import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import React from "react";
import { cleanup, renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import api from "@/lib/api";

let impersonating = false;
mock.module("@/hooks/useAuth", { namedExports: { useAuth: () => ({
  user: { id: "tutor-1", role: "tutor" }, isAuthenticated: true, isImpersonating: impersonating,
}) } });

let useUiHints: typeof import("./useUiHints").useUiHints;
before(async () => { useUiHints = (await import("./useUiHints")).useUiHints; });

let client: QueryClient;
let serverPreferences: Record<string, unknown> | undefined;
let patches: Array<Record<string, unknown>>;
const store = () => window.localStorage;

beforeEach(() => {
  impersonating = false; patches = [];
  serverPreferences = { dark_mode: false, ui_hints: {} };
  store().clear();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  api.defaults.adapter = async (config) => {
    if (config.method === "patch") {
      patches.push(JSON.parse(config.data));
      return { config, data: { preferences: serverPreferences }, status: 200, statusText: "OK", headers: {} };
    }
    return { config, data: { preferences: serverPreferences }, status: 200, statusText: "OK", headers: {} };
  };
});
afterEach(() => { cleanup(); client.clear(); store().clear(); });

const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

test("it is ready once the account and the local mirror are read, and merges both", async () => {
  serverPreferences = { ui_hints: { tutor_setup_tour: { shown_count: 1, last_shown_at: "2026-10-10T10:00:00Z" } } };
  store().setItem("hocam:ui-hints:v1:tutor-1", JSON.stringify({ tutor_setup_tour: { shown_count: 2, acknowledged_at: "2026-10-11T10:00:00Z" } }));
  const { result } = renderHook(() => useUiHints(), { wrapper });
  await waitFor(() => assert.equal(result.current.ready, true));
  assert.deepEqual(result.current.hints.tutor_setup_tour, {
    shown_count: 2, last_shown_at: "2026-10-10T10:00:00Z", acknowledged_at: "2026-10-11T10:00:00Z",
  });
});

test("a backend without the field still works from the local mirror", async () => {
  serverPreferences = { dark_mode: false };
  const { result } = renderHook(() => useUiHints(), { wrapper });
  await waitFor(() => assert.equal(result.current.ready, true));
  act(() => result.current.record("tutor_availability_hint", { acknowledged_at: "2026-10-17T10:00:00Z" }));
  assert.equal(result.current.hints.tutor_availability_hint?.acknowledged_at, "2026-10-17T10:00:00Z");
});

test("recording writes the mirror and tells the account", async () => {
  const { result } = renderHook(() => useUiHints(), { wrapper });
  await waitFor(() => assert.equal(result.current.ready, true));
  act(() => result.current.record("tutor_setup_tour", { shown_count: 1, last_shown_at: "2026-10-17T10:00:00Z" }));
  assert.deepEqual(JSON.parse(store().getItem("hocam:ui-hints:v1:tutor-1") ?? "{}"), {
    tutor_setup_tour: { shown_count: 1, last_shown_at: "2026-10-17T10:00:00Z" },
  });
  await waitFor(() => assert.equal(patches.length, 1));
  assert.deepEqual(patches[0], { preferences: { ui_hints: { tutor_setup_tour: { shown_count: 1, last_shown_at: "2026-10-17T10:00:00Z" } } } });
});

test("a second record keeps what the first one wrote", async () => {
  const { result } = renderHook(() => useUiHints(), { wrapper });
  await waitFor(() => assert.equal(result.current.ready, true));
  act(() => result.current.record("tutor_setup_tour", { shown_count: 1, last_shown_at: "2026-10-17T10:00:00Z" }));
  act(() => result.current.record("tutor_setup_tour", { acknowledged_at: "2026-10-17T10:00:05Z" }));
  await waitFor(() => assert.equal(patches.length, 2));
  assert.deepEqual(patches[1], { preferences: { ui_hints: { tutor_setup_tour: {
    shown_count: 1, last_shown_at: "2026-10-17T10:00:00Z", acknowledged_at: "2026-10-17T10:00:05Z",
  } } } });
});

test("a failed write leaves the mirror in place", async () => {
  api.defaults.adapter = async (config) => {
    if (config.method === "patch") throw new Error("offline");
    return { config, data: { preferences: {} }, status: 200, statusText: "OK", headers: {} };
  };
  const { result } = renderHook(() => useUiHints(), { wrapper });
  await waitFor(() => assert.equal(result.current.ready, true));
  act(() => result.current.record("tutor_packages_reviewed", { completed_at: "2026-10-17T10:00:00Z" }));
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(result.current.hints.tutor_packages_reviewed?.completed_at, "2026-10-17T10:00:00Z");
});

test("an admin impersonating a tutor never becomes ready and never writes", async () => {
  impersonating = true;
  const { result } = renderHook(() => useUiHints(), { wrapper });
  act(() => result.current.record("tutor_setup_tour", { shown_count: 1 }));
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(result.current.ready, false);
  assert.equal(patches.length, 0);
  assert.equal(store().getItem("hocam:ui-hints:v1:tutor-1"), null);
});

test("an answer that is not a profile keeps it not ready", async () => {
  api.defaults.adapter = async (config) => ({ config, data: [], status: 200, statusText: "OK", headers: {} });
  const { result } = renderHook(() => useUiHints(), { wrapper });
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(result.current.ready, false);
});
