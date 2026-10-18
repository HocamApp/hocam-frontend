import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { UiHintKey, UiHintRecord, UiHints } from "@/lib/tutorSetupHints";

let hints: UiHints = {};
let ready = true;
let query = "";
const recorded: Array<[UiHintKey, UiHintRecord]> = [];

mock.module("next/navigation", { namedExports: { useSearchParams: () => new URLSearchParams(query) } });
mock.module("@/hooks/useUiHints", { namedExports: { useUiHints: () => ({ hints, ready, record: (key: UiHintKey, patch: UiHintRecord) => { recorded.push([key, patch]); } }) } });
mock.module("@/components/ai/AISupportChatWidget", { namedExports: {
  AISupportChatWidget: ({ fabRef, suppressAttention }: { fabRef?: React.Ref<HTMLButtonElement>; suppressAttention?: boolean }) =>
    <button ref={fabRef} data-suppress={String(Boolean(suppressAttention))}>Sohbeti aç</button>,
} });

let Assistant: typeof import("./TutorDashboardAssistant").TutorDashboardAssistant;
before(async () => { Assistant = (await import("./TutorDashboardAssistant")).TutorDashboardAssistant; });

const answered = { acknowledged_at: "2026-10-17T10:00:00Z" };
beforeEach(() => { hints = { tutor_dashboard_tour: answered }; ready = true; query = ""; recorded.length = 0; });
afterEach(() => { cleanup(); document.querySelectorAll("[data-test-modal]").forEach((node) => node.remove()); });
const mount = () => render(<Assistant delayMs={0} />);
const settle = () => new Promise((resolve) => setTimeout(resolve, 40));

test("once the dashboard tour is answered, the button gets one explanation and the attention card stands aside", async () => {
  mount();
  assert.ok(await screen.findByText("Soruların için yardımcın burada"));
  assert.equal(screen.getByRole("button", { name: "Sohbeti aç" }).getAttribute("data-suppress"), "true");
  fireEvent.click(screen.getByRole("button", { name: "Anladım" }));
  await waitFor(() => assert.equal(screen.queryByText("Soruların için yardımcın burada"), null));
  assert.deepEqual(recorded.map(([key]) => key), ["tutor_chat_hint"]);
  assert.ok(recorded[0][1].acknowledged_at);
});

test("it does not compete with the tour: nothing until the tour has been answered, and the attention card stays away meanwhile", async () => {
  hints = {};
  mount();
  await settle();
  assert.equal(screen.queryByText("Soruların için yardımcın burada"), null);
  assert.equal(screen.getByRole("button", { name: "Sohbeti aç" }).getAttribute("data-suppress"), "true");
});

test("for a tutor who has answered everything the attention card is left alone", async () => {
  hints = { tutor_dashboard_tour: answered, tutor_chat_hint: answered };
  mount();
  await settle();
  assert.equal(screen.getByRole("button", { name: "Sohbeti aç" }).getAttribute("data-suppress"), "false");
});

test("a hint visit stays quiet to the end, the card does not pop up when the last button is pressed", async () => {
  const view = mount();
  await screen.findByText("Soruların için yardımcın burada");
  fireEvent.click(screen.getByRole("button", { name: "Anladım" }));
  await waitFor(() => assert.equal(screen.queryByText("Soruların için yardımcın burada"), null));
  hints = { tutor_dashboard_tour: answered, tutor_chat_hint: answered };
  view.rerender(<Assistant delayMs={0} />);
  assert.equal(screen.getByRole("button", { name: "Sohbeti aç" }).getAttribute("data-suppress"), "true");
});

test("it is shown once: an answered hint never comes back", async () => {
  hints = { tutor_dashboard_tour: answered, tutor_chat_hint: answered };
  mount();
  await settle();
  assert.equal(screen.queryByText("Soruların için yardımcın burada"), null);
});

test("it stays off the bookings sub-view and while the hint state is not ready", async () => {
  query = "tab=bookings";
  mount();
  await settle();
  assert.equal(screen.queryByText("Soruların için yardımcın burada"), null);
  cleanup();
  query = ""; ready = false;
  mount();
  await settle();
  assert.equal(screen.queryByText("Soruların için yardımcın burada"), null);
  assert.equal(recorded.length, 0);
});

test("a click elsewhere does not close it or count as read", async () => {
  mount();
  await screen.findByText("Soruların için yardımcın burada");
  fireEvent.pointerDown(document.body);
  fireEvent.keyDown(screen.getByRole("dialog", { name: "Soruların için yardımcın burada" }), { key: "Escape" });
  await settle();
  assert.ok(screen.getByText("Soruların için yardımcın burada"));
  assert.equal(recorded.length, 0);
});

test("opening the chat is the answer too", async () => {
  mount();
  await screen.findByText("Soruların için yardımcın burada");
  fireEvent.click(screen.getByRole("button", { name: "Sohbeti aç" }));
  await waitFor(() => assert.equal(screen.queryByText("Soruların için yardımcın burada"), null));
  assert.equal(recorded.length, 1);
});

test("an open modal postpones it without answering", async () => {
  const modal = document.createElement("div");
  modal.setAttribute("role", "dialog"); modal.setAttribute("data-test-modal", "");
  document.body.appendChild(modal);
  mount();
  await settle();
  assert.equal(screen.queryByText("Soruların için yardımcın burada"), null);
  assert.equal(recorded.length, 0);
});
