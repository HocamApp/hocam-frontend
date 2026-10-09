import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { CoachingFilePicker } from "./CoachingFilePicker";

after(() => window.close());
afterEach(cleanup);

describe("CoachingFilePicker", () => {
  it("is a labelled, keyboard-reachable input that hands over the chosen file", () => {
    const files: File[] = [];
    render(<CoachingFilePicker label="Kanıt ekle" hint="PDF veya görsel" onFile={(f) => files.push(f)} />);

    const input = screen.getByLabelText("Kanıt ekle") as HTMLInputElement;
    assert.equal(input.type, "file");
    assert.doesNotMatch(input.className, /\bhidden\b/);
    assert.match(input.className, /sr-only/);
    assert.equal(input.getAttribute("aria-describedby"), screen.getByText("PDF veya görsel").id);

    const file = new File(["x"], "kanit.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });
    assert.deepEqual(files.map((f) => f.name), ["kanit.pdf"]);
  });
});
