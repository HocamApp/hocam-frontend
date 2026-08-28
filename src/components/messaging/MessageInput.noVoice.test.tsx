import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

/**
 * Voice messaging was removed as a product feature. These tests hold the line:
 * the composer must expose no recording control and must never reach for the
 * microphone, while text, image and file sending stay intact.
 */

const sendCalls: Record<string, unknown>[] = [];
let getUserMediaCalls = 0;
let mediaRecorderConstructed = 0;

mock.module("@/lib/messagingApi", {
  namedExports: {
    sendMessage: async (payload: Record<string, unknown>) => {
      sendCalls.push(payload);
      return {
        id: "message-new",
        conversation: "conversation-1",
        sender: "student-1",
        message_text: String(payload.message_text ?? ""),
        created_at: "2026-08-18T10:00:00Z",
        read_at: null,
        is_deleted: false,
        attachment: null,
      };
    },
  },
});

mock.module("@/lib/sound", { namedExports: { playSendSound: () => {} } });
mock.module("@/lib/messageImage", {
  namedExports: {
    formatImageSize: () => "10 KB",
    prepareMessageImage: async (file: File) => ({ file, compressed: false }),
  },
});

let MessageInput: typeof import("./MessageInput").MessageInput;

before(async () => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: window.localStorage,
  });
  // jsdom here has no rAF; the composer refocuses through it after a send.
  if (typeof globalThis.requestAnimationFrame !== "function") {
    (globalThis as unknown as { requestAnimationFrame: unknown }).requestAnimationFrame = (
      cb: FrameRequestCallback
    ) => setTimeout(() => cb(0), 0) as unknown as number;
  }
  // Any touch of these is a failure, so record instead of implementing them.
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: async () => {
        getUserMediaCalls += 1;
        throw new Error("microphone must never be requested");
      },
    },
  });
  class ForbiddenMediaRecorder {
    constructor() {
      mediaRecorderConstructed += 1;
      throw new Error("MediaRecorder must never be constructed");
    }
    static isTypeSupported() {
      return true;
    }
  }
  (globalThis as unknown as { MediaRecorder: unknown }).MediaRecorder = ForbiddenMediaRecorder;
  ({ MessageInput } = await import("./MessageInput"));
});

after(() => window.close());
afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  sendCalls.length = 0;
  getUserMediaCalls = 0;
  mediaRecorderConstructed = 0;
});

function renderInput() {
  return render(
    <MessageInput conversationId="conversation-1" onMessageSent={() => {}} />
  );
}

describe("voice messaging removal", () => {
  it("renders no microphone or recording control", () => {
    renderInput();

    assert.equal(screen.queryByRole("button", { name: /ses kaydı/i }), null);
    assert.equal(screen.queryByRole("button", { name: /mikrofon/i }), null);
    assert.equal(screen.queryByRole("button", { name: /kaydı bitir/i }), null);
    assert.equal(screen.queryByLabelText(/ses/i), null);
  });

  it("never requests microphone permission or constructs a recorder", async () => {
    renderInput();
    for (const button of screen.getAllByRole("button")) {
      await act(async () => {
        fireEvent.click(button);
      });
    }

    assert.equal(getUserMediaCalls, 0);
    assert.equal(mediaRecorderConstructed, 0);
  });

  it("does not offer audio types in the attachment picker", () => {
    const { container } = renderInput();
    const accepts = Array.from(container.querySelectorAll("input[type=file]")).map(
      (input) => input.getAttribute("accept") ?? ""
    );

    assert.ok(accepts.length > 0);
    for (const accept of accepts) {
      assert.equal(/audio\//.test(accept), false);
      assert.equal(/\.mp3|\.m4a/.test(accept), false);
    }
    // Images and documents are still offered.
    assert.ok(accepts.some((a) => a.includes("image/png")));
    assert.ok(accepts.some((a) => a.includes("application/pdf")));
  });

  it("still sends a text message", async () => {
    renderInput();
    const textarea = screen.getByPlaceholderText("Mesajınızı yazın...");
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Merhaba hocam" } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Gönder" }));
    });

    assert.equal(sendCalls.length, 1);
    assert.equal(sendCalls[0].message_text, "Merhaba hocam");
    assert.equal(sendCalls[0].attachment_kind, undefined);
    assert.equal(
      screen.queryByText(/T\.C\. kimlik numarası/),
      null
    );
    assert.equal(
      localStorage.getItem("hocam_sensitive_data_guidance_seen"),
      "true"
    );
  });

  it("shows the privacy guidance only until the first successful message", async () => {
    const firstRender = renderInput();
    assert.ok(await screen.findByText(/T\.C\. kimlik numarası/));
    firstRender.unmount();

    localStorage.setItem("hocam_sensitive_data_guidance_seen", "true");
    renderInput();
    assert.equal(screen.queryByText(/T\.C\. kimlik numarası/), null);
  });

  it("classifies a selected file attachment as file, never voice", async () => {
    const { container } = renderInput();
    const attachmentInput = Array.from(container.querySelectorAll("input[type=file]")).find(
      (input) => (input.getAttribute("accept") ?? "").includes("application/pdf")
    ) as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], "odev.pdf", {
      type: "application/pdf",
    });
    await act(async () => {
      fireEvent.change(attachmentInput, { target: { files: [file] } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Gönder" }));
    });

    assert.equal(sendCalls.length, 1);
    assert.equal(sendCalls[0].attachment_kind, "file");
  });

  it("classifies a selected image attachment as image", async () => {
    const { container } = renderInput();
    const attachmentInput = Array.from(container.querySelectorAll("input[type=file]")).find(
      (input) => (input.getAttribute("accept") ?? "").includes("application/pdf")
    ) as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], "foto.png", { type: "image/png" });
    await act(async () => {
      fireEvent.change(attachmentInput, { target: { files: [file] } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Gönder" }));
    });

    assert.equal(sendCalls.length, 1);
    assert.equal(sendCalls[0].attachment_kind, "image");
  });
});
