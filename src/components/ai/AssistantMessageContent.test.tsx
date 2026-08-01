import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { AssistantMessageContent } from "./AssistantMessageContent";

after(() => window.close());
afterEach(() => cleanup());

const packageResponse = `Paketlerin veya ders hakların görünmüyorsa hesabına uygun aktif paketlerden biri henüz yansımamış olabilir.

## Uygun paketler

**Haftada 1 Ders · 2 Haftalık Paket**
- Haftada 1 ders
- Süre: 14 gün
- Toplam: 2 ders

**Haftada 2 Ders · 2 Haftalık Paket**
- Haftada 2 ders
- Süre: 14 gün
- Toplam: 4 ders
- İndirim: %1

**Haftada 3 Ders · 2 Haftalık Paket**
- Haftada 3 ders
- Süre: 14 gün
- Toplam: 6 ders
- İndirim: %2

## Fiyatlandırma

Net fiyat, seçtiğin hocanın ders ücretine göre hesaplanır.`;

describe("AssistantMessageContent", () => {
  it("renders paragraphs, headings, strong labels and real semantic lists without losing facts", () => {
    const { container } = render(<AssistantMessageContent content={packageResponse} />);

    assert.ok(screen.getByRole("heading", { level: 2, name: "Uygun paketler" }));
    assert.ok(screen.getByRole("heading", { level: 2, name: "Fiyatlandırma" }));
    assert.equal(container.querySelectorAll("ul").length, 3);
    assert.equal(container.querySelectorAll("li").length, 11);
    assert.equal(container.querySelectorAll("strong").length, 3);

    for (const fact of [
      "Haftada 1 Ders · 2 Haftalık Paket",
      "Toplam: 2 ders",
      "Toplam: 4 ders",
      "İndirim: %1",
      "Toplam: 6 ders",
      "İndirim: %2",
      "Net fiyat, seçtiğin hocanın ders ücretine göre hesaplanır.",
    ]) {
      assert.ok(screen.getByText(fact));
    }
    assert.equal(container.textContent?.includes("line-clamp"), false);
  });

  it("supports plain text, multiple paragraphs, ordered lists, emphasis and rules", () => {
    const { container } = render(
      <AssistantMessageContent
        content={`Tek paragraflık düz yanıt.\n\nİkinci paragraf *vurgulu* bilgi içerir.\n\n1. İlk adım\n2. İkinci adım\n\n---`}
      />
    );

    assert.equal(container.querySelectorAll("p").length, 2);
    assert.equal(container.querySelectorAll("ol").length, 1);
    assert.equal(container.querySelectorAll("li").length, 2);
    assert.equal(container.querySelectorAll("em").length, 1);
    assert.equal(container.querySelectorAll("hr").length, 1);
  });

  it("renders GFM tables, blockquotes, safe links, inline code and code blocks", () => {
    const longUrl = "https://example.com/" + "cok-uzun-bir-yol-".repeat(12);
    const { container } = render(
      <AssistantMessageContent
        content={`> Bilgi notu\n\n[Kaynak](${longUrl}) ve \`inline\` değer.\n\n| Paket | Ders |\n| --- | ---: |\n| Düzenli | 4 |\n\n\`\`\`ts\nconst toplam = 4;\n\`\`\``}
      />
    );

    assert.ok(container.querySelector("blockquote"));
    assert.ok(screen.getByRole("region", { name: "Yanıt tablosu" }));
    assert.ok(container.querySelector("table"));
    const link = screen.getByRole("link", { name: "Kaynak" });
    assert.equal(link.getAttribute("target"), "_blank");
    assert.equal(link.getAttribute("rel"), "noopener noreferrer");
    assert.ok(link.className.includes("overflow-wrap:anywhere"));
    assert.ok(container.querySelector("p code"));
    assert.ok(container.querySelector("pre code"));
  });

  it("never executes or mounts model-provided HTML and rejects unsafe link protocols", () => {
    const { container } = render(
      <AssistantMessageContent
        content={`Güvenli başlangıç.\n\n<script>window.alert('xss')</script>\n\n[Tehlikeli](javascript:alert('xss'))\n\nGüvenli bitiş.`}
      />
    );

    assert.equal(container.querySelector("script"), null);
    assert.equal(container.innerHTML.includes("window.alert"), false);
    assert.equal(screen.getByText("Tehlikeli").closest("a")?.getAttribute("href"), "");
    assert.ok(screen.getByText("Güvenli başlangıç."));
    assert.ok(screen.getByText("Güvenli bitiş."));
  });

  it("keeps incomplete streaming Markdown readable and provides an empty fallback", () => {
    const { rerender } = render(
      <AssistantMessageContent content={"## Hazırlanıyor\n\n- İlk madde\n- **Yarım kalan"} />
    );

    assert.ok(screen.getByRole("heading", { level: 2, name: "Hazırlanıyor" }));
    assert.ok(screen.getByText(/Yarım kalan/));

    rerender(<AssistantMessageContent content="   " />);
    assert.ok(screen.getByRole("note"));
  });

  it("uses bounded, wrapping token-based typography for mobile and dark mode", () => {
    const { container } = render(
      <AssistantMessageContent content={"Taşmadan görünen uzun içerik."} />
    );
    const root = container.firstElementChild as HTMLElement;

    assert.ok(root.className.includes("max-w-[72ch]"));
    assert.ok(root.className.includes("overflow-wrap:anywhere"));
    assert.ok(root.className.includes("text-foreground"));
    assert.doesNotMatch(root.outerHTML, /#[0-9a-f]{3,8}/i);
  });
});
