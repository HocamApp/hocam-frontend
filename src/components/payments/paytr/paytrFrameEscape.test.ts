import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isFramedWindow, moveTopWindowHere } from "./paytrFrameEscape";

function fakeWindow({ framed, throwOnTop = false, throwOnReplace = false }: {
  framed: boolean;
  throwOnTop?: boolean;
  throwOnReplace?: boolean;
}) {
  const moves: string[] = [];
  const top = {
    location: {
      replace: (href: string) => {
        if (throwOnReplace) throw new Error("blocked");
        moves.push(href);
      },
    },
  };
  const win = {
    location: { href: "https://hocamozelders.com/odeme/basarili" },
    self: null as unknown,
    get top() {
      if (throwOnTop) throw new Error("cross-origin");
      return framed ? top : (win as unknown as typeof top);
    },
  };
  win.self = win;
  return { win, moves };
}

describe("paytrFrameEscape", () => {
  it("knows the top window from a framed document", () => {
    assert.equal(isFramedWindow(fakeWindow({ framed: false }).win), false);
    assert.equal(isFramedWindow(fakeWindow({ framed: true }).win), true);
    // A top it cannot even look at is someone else's frame: treat as framed.
    assert.equal(isFramedWindow(fakeWindow({ framed: true, throwOnTop: true }).win), true);
  });

  it("moves the top window to this exact address", () => {
    const { win, moves } = fakeWindow({ framed: true });
    assert.equal(moveTopWindowHere(win), true);
    assert.deepEqual(moves, ["https://hocamozelders.com/odeme/basarili"]);
  });

  it("reports, never throws, when the top window refuses", () => {
    const { win, moves } = fakeWindow({ framed: true, throwOnReplace: true });
    assert.equal(moveTopWindowHere(win), false);
    assert.deepEqual(moves, []);
  });
});
