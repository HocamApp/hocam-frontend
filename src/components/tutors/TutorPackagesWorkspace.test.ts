import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../../app/(main)/dashboard/tutor/packages/page.tsx", import.meta.url),
  "utf8",
);

test("package editor uses the shared tutor workspace shell and design language", () => {
  assert.match(source, /WorkspacePageShell/);
  assert.match(source, /@phosphor-icons\/react/);
  assert.doesNotMatch(source, /lucide-react/);
  assert.doesNotMatch(source, /rounded-xl|rounded-2xl|rounded-3xl/);
  assert.match(source, /border-line/);
  assert.match(source, /bg-paper/);
});

