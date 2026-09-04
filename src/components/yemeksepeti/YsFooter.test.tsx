import assert from "node:assert/strict";
import { mock, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

let pathname = "/";

mock.module("next/navigation", {
  namedExports: {
    usePathname: () => pathname,
  },
});

mock.module("next/link", {
  defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
});

test("does not render the global footer on the messages inbox", async () => {
  pathname = "/messages";
  const { YsFooter } = await import("./YsFooter");

  const html = renderToStaticMarkup(<YsFooter />);

  assert.equal(html, "");
});

test("does not render the global footer inside a conversation", async () => {
  pathname = "/messages/conversation-1";
  const { YsFooter } = await import("./YsFooter");

  const html = renderToStaticMarkup(<YsFooter />);

  assert.equal(html, "");
});

test("keeps the global footer on ordinary pages", async () => {
  pathname = "/tutors";
  const { YsFooter } = await import("./YsFooter");

  const html = renderToStaticMarkup(<YsFooter />);

  assert.match(html, /^<footer/);
});


test("retired pages are absent and FAQ points to the homepage", async () => {
  pathname = "/iletisim";
  const { YsFooter } = await import("./YsFooter");
  const html = renderToStaticMarkup(<YsFooter />);
  assert.doesNotMatch(html, /online-ozel-ders-ucretleri|basari-hikayeleri|>Blog</);
  assert.match(html, /href="\/#merak-edilenler"/);
});

test("footer shortcuts land on the filtered home directory and trial guide", async () => {
  pathname = "/iletisim";
  const { YsFooter } = await import("./YsFooter");
  const html = renderToStaticMarkup(<YsFooter />);
  assert.doesNotMatch(html, /Kariyer|Giriş yap|Hoca dizini/);
  assert.match(html, /href="\/#ys-tutor-list-title"[^>]*>Hoca Listesi</);
  assert.match(html, /href="\/\?exam_type=YKS#ys-tutor-list-title"/);
  assert.match(html, /href="\/\?subject=Matematik&amp;exam_type=TYT#ys-tutor-list-title"/);
  assert.match(html, /href="\/\?subject=Matematik&amp;exam_type=AYT#ys-tutor-list-title"/);
  assert.match(html, /href="\/ucretsiz-deneme-dersi"/);
});

test("every legal footer entry is a real link, none inert", async () => {
  // Every published legal text stays reachable from the sidebar on /kvkk.
  // The footer carries only the ones a reader looks for by name, and
  // /kvkk/veli-onayi in particular must not be here: it is a token-gated
  // confirmation flow, so a footer link lands every visitor on an error.
  pathname = "/iletisim";
  const { YsFooter } = await import("./YsFooter");
  const html = renderToStaticMarkup(<YsFooter />);

  assert.match(html, />Yasal Metinler</);
  assert.doesNotMatch(html, /KVKK ve gizlilik/);

  assert.match(html, /href="\/kvkk"/);
  assert.match(html, /href="\/kullanim-kosullari"/);
  assert.match(html, /href="\/mesafeli-satis-sozlesmesi"/);
  assert.match(html, /href="\/kvkk\/cerez-politikasi"/);
  assert.match(html, /href="\/iptal-ve-iade"/);

  // /kvkk redirects onto the aydınlatma metni, so linking that document
  // separately would put two links to the same page side by side.
  assert.doesNotMatch(html, /href="\/kvkk\/aydinlatma-metni"/);

  assert.doesNotMatch(html, /href="\/kvkk\/veli-onayi"/);
  assert.doesNotMatch(html, /href="\/kvkk\/analitik"/);
  assert.doesNotMatch(html, /href="\/kvkk\/ogrenci-gelisim-kayitlari"/);

  // Nothing in the legal footer is inert copy any more.
  assert.doesNotMatch(html, /<span[^>]*>Mesafeli Satış Sözleşmesi<\/span>/);
  assert.doesNotMatch(html, /<span[^>]*>Kullanım Koşulları<\/span>/);
});

test("only the social accounts that exist are links", async () => {
  // Rule 2 in the footer docblock: nothing here claims a channel Hocam does
  // not own. Instagram and LinkedIn are real; X and YouTube are decoration
  // until an account exists, so they stay unlinked and hidden from assistive
  // tech even though the group around them is now exposed.
  pathname = "/iletisim";
  const { YsFooter } = await import("./YsFooter");
  const html = renderToStaticMarkup(<YsFooter />);

  assert.match(html, /href="https:\/\/www\.instagram\.com\/hocam\.co"/);
  assert.match(html, /href="https:\/\/www\.linkedin\.com\/company\/hocamozelders\/"/);
  // The share URL's tracking parameter has no business in a footer link.
  assert.doesNotMatch(html, /igsi=/);

  assert.doesNotMatch(html, /href="[^"]*(twitter|x\.com|youtube)/i);
  assert.match(html, /<span[^>]*aria-hidden="true"[^>]*>/);

  // External links open away from the app and must not hand over the opener.
  assert.match(html, /rel="noreferrer noopener"/);
});
