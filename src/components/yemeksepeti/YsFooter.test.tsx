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
