import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { Message, MessageAttachment } from "@/types";

const accessCalls: string[] = [];
let accessImpl: (id: string) => Promise<{ url: string; expires_in: number }> = async (id) => {
  accessCalls.push(id);
  return { url: `https://storage.example/signed/${id}?token=first`, expires_in: 60 };
};

let MessageBubble: typeof import("./MessageBubble").MessageBubble;

before(async () => {
  mock.module("@/lib/messagingApi", {
    namedExports: {
      fetchMessageAttachmentAccess: (id: string) => accessImpl(id),
    },
  });
  ({ MessageBubble } = await import("./MessageBubble"));
});

after(() => window.close());
afterEach(cleanup);

const BASE: Message = {
  id: "message-1",
  conversation: "conversation-1",
  sender: "tutor-1",
  message_text: "",
  created_at: "2026-08-18T10:00:00Z",
  read_at: null,
  is_deleted: false,
  attachment: null,
};

const IMAGE_ATTACHMENT: MessageAttachment = {
  id: "attachment-image-1",
  kind: "image",
  original_name: "legacy-image.jpg",
  mime_type: "image/jpeg",
  size_bytes: 2048,
  storage_state: "active",
  download_url: "/api/messages/attachments/attachment-image-1/download/",
};

function resetAccess(
  impl?: (id: string) => Promise<{ url: string; expires_in: number }>
) {
  accessCalls.length = 0;
  accessImpl =
    impl ??
    (async (id) => {
      accessCalls.push(id);
      return { url: `https://storage.example/signed/${id}?token=first`, expires_in: 60 };
    });
}

async function renderBubble(message: Message) {
  const result = render(<MessageBubble isOwnMessage={false} message={message} />);
  // Flush the access request scheduled on mount.
  await act(async () => {});
  return result;
}

describe("private message image rendering", () => {
  beforeEach(() => resetAccess());

  it("still renders a legacy public image_url when no attachment exists", async () => {
    await renderBubble({
      ...BASE,
      image_url: "https://storage.example/storage/v1/object/public/message-attachments/c/o.jpg",
    });

    const image = screen.getByAltText("Görsel ek") as HTMLImageElement;
    assert.match(image.src, /object\/public\/message-attachments/);
    assert.equal(accessCalls.length, 0);
  });

  it("renders a private image attachment inline through the authorized endpoint", async () => {
    await renderBubble({ ...BASE, attachment: IMAGE_ATTACHMENT });

    await waitFor(() => {
      assert.ok(screen.getByAltText("Görsel ek: legacy-image.jpg"));
    });
    const image = screen.getByAltText("Görsel ek: legacy-image.jpg") as HTMLImageElement;
    assert.match(image.src, /storage\.example\/signed\/attachment-image-1/);
    assert.equal(screen.queryByRole("button", { name: /legacy-image\.jpg/ }), null);
  });

  it("requests access using the attachment id", async () => {
    await renderBubble({ ...BASE, attachment: IMAGE_ATTACHMENT });

    await waitFor(() => assert.equal(accessCalls.length, 1));
    assert.deepEqual(accessCalls, ["attachment-image-1"]);
  });

  it("prefers the private attachment when a legacy image_url is also present", async () => {
    await renderBubble({
      ...BASE,
      image_url: "https://storage.example/storage/v1/object/public/message-attachments/c/o.jpg",
      attachment: IMAGE_ATTACHMENT,
    });

    await waitFor(() => {
      assert.ok(screen.getByAltText("Görsel ek: legacy-image.jpg"));
    });
    assert.equal(screen.queryByAltText("Görsel ek"), null);
    const image = screen.getByAltText("Görsel ek: legacy-image.jpg") as HTMLImageElement;
    assert.ok(!image.src.includes("object/public"));
  });

  it("shows a loading state before the authorized URL resolves", async () => {
    let release: (() => void) | null = null;
    resetAccess(async (id) => {
      accessCalls.push(id);
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return { url: `https://storage.example/signed/${id}`, expires_in: 60 };
    });

    render(<MessageBubble isOwnMessage={false} message={{ ...BASE, attachment: IMAGE_ATTACHMENT }} />);

    assert.ok(screen.getByLabelText("Görsel yükleniyor"));
    await act(async () => {
      release?.();
    });
  });

  it("shows a non-disruptive error state when access is denied or fails", async () => {
    resetAccess(async (id) => {
      accessCalls.push(id);
      throw new Error("denied");
    });

    await renderBubble({ ...BASE, attachment: IMAGE_ATTACHMENT, message_text: "Merhaba" });

    await waitFor(() => {
      assert.ok(screen.getByRole("alert"));
    });
    assert.ok(screen.getByRole("button", { name: "Yeniden dene" }));
    // The rest of the bubble is unaffected.
    assert.ok(screen.getByText("Merhaba"));
  });

  it("re-requests a signed URL when the image fails to load, then succeeds", async () => {
    let call = 0;
    resetAccess(async (id) => {
      accessCalls.push(id);
      call += 1;
      return { url: `https://storage.example/signed/${id}?token=v${call}`, expires_in: 60 };
    });

    await renderBubble({ ...BASE, attachment: IMAGE_ATTACHMENT });
    await waitFor(() => assert.equal(accessCalls.length, 1));

    const image = screen.getByAltText("Görsel ek: legacy-image.jpg") as HTMLImageElement;
    await act(async () => {
      fireEvent.error(image);
    });

    await waitFor(() => assert.equal(accessCalls.length, 2));
    const refreshed = screen.getByAltText("Görsel ek: legacy-image.jpg") as HTMLImageElement;
    assert.match(refreshed.src, /token=v2/);
  });

  it("bounds automatic refreshes so a permanently failing image cannot loop", async () => {
    resetAccess(async (id) => {
      accessCalls.push(id);
      return { url: `https://storage.example/signed/${id}?token=always-bad`, expires_in: 60 };
    });

    await renderBubble({ ...BASE, attachment: IMAGE_ATTACHMENT });
    await waitFor(() => assert.equal(accessCalls.length, 1));

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const image = screen.queryByAltText("Görsel ek: legacy-image.jpg");
      if (!image) break;
      await act(async () => {
        fireEvent.error(image);
      });
    }

    // 1 initial + MAX_IMAGE_ACCESS_RETRIES (2) automatic re-requests, then stop.
    assert.equal(accessCalls.length, 3);
    await waitFor(() => assert.ok(screen.getByRole("alert")));
  });

  it("manual retry re-requests access after the bounded retries are exhausted", async () => {
    resetAccess(async (id) => {
      accessCalls.push(id);
      throw new Error("denied");
    });

    await renderBubble({ ...BASE, attachment: IMAGE_ATTACHMENT });
    await waitFor(() => assert.equal(accessCalls.length, 1));

    resetAccess();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Yeniden dene" }));
    });

    await waitFor(() => {
      assert.ok(screen.getByAltText("Görsel ek: legacy-image.jpg"));
    });
    assert.equal(accessCalls.length, 1);
  });

  it("opens the lightbox with the current authorized URL", async () => {
    await renderBubble({ ...BASE, attachment: IMAGE_ATTACHMENT });
    await waitFor(() => assert.ok(screen.getByAltText("Görsel ek: legacy-image.jpg")));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Görseli büyüt" }));
    });

    await waitFor(() => assert.ok(screen.getByAltText("Mesaj görseli")));
    const preview = screen.getByAltText("Mesaj görseli") as HTMLImageElement;
    assert.match(preview.src, /storage\.example\/signed\/attachment-image-1/);
  });

  it("keeps generic file attachments as an authorized download action", async () => {
    await renderBubble({
      ...BASE,
      attachment: {
        ...IMAGE_ATTACHMENT,
        id: "attachment-file-1",
        kind: "file",
        original_name: "odev.pdf",
        mime_type: "application/pdf",
      },
    });

    assert.ok(screen.getByText("odev.pdf"));
    assert.equal(screen.queryByAltText(/Görsel ek/), null);
    assert.equal(accessCalls.length, 0);
  });

  it("keeps voice attachments unchanged", async () => {
    await renderBubble({
      ...BASE,
      attachment: {
        ...IMAGE_ATTACHMENT,
        id: "attachment-voice-1",
        kind: "voice",
        original_name: "ses.webm",
        mime_type: "audio/webm",
      },
    });

    assert.ok(screen.getByRole("button", { name: "Sesli mesajı oynat" }));
    assert.equal(accessCalls.length, 0);
  });

  it("leaves text-only messages untouched", async () => {
    await renderBubble({ ...BASE, message_text: "Sadece metin" });

    assert.ok(screen.getByText("Sadece metin"));
    assert.equal(screen.queryByAltText(/Görsel/), null);
    assert.equal(accessCalls.length, 0);
  });

  it("does not render an image for a non-active image attachment", async () => {
    await renderBubble({
      ...BASE,
      attachment: { ...IMAGE_ATTACHMENT, storage_state: "pending" },
    });

    assert.equal(screen.queryByAltText("Görsel ek: legacy-image.jpg"), null);
    assert.equal(accessCalls.length, 0);
  });

  it("never writes the signed URL into the message model or web storage", async () => {
    const message: Message = { ...BASE, attachment: IMAGE_ATTACHMENT };
    await renderBubble(message);
    await waitFor(() => assert.ok(screen.getByAltText("Görsel ek: legacy-image.jpg")));

    assert.equal(JSON.stringify(message).includes("signed"), false);
    assert.equal(message.attachment?.download_url.includes("signed"), false);
    const persisted = [
      ...Object.values(window.localStorage),
      ...Object.values(window.sessionStorage),
    ].join(" ");
    assert.equal(persisted.includes("storage.example/signed"), false);
  });
});
