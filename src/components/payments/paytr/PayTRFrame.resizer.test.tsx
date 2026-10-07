import "@/test/setupDom";

process.env.NEXT_PUBLIC_PAYTR_ENABLED = "true";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render } from "@testing-library/react";

/**
 * PayTR's own iframe integration (dev.paytr.com/iframe-api/iframe-api-1-adim)
 * embeds the frame as id="paytriframe", loads
 * https://www.paytr.com/js/iframeResizer.min.js and calls
 * iFrameResize({},'#paytriframe'). This proves our side of that with a mocked
 * next/script; whether the height really follows PayTR's content is a
 * staging card-test question.
 */

type ScriptProps = { src: string; strategy?: string; onReady?: () => void };
const scripts: ScriptProps[] = [];
const resizeCalls: unknown[][] = [];

let PayTRFrame: typeof import("./PayTRFrame").PayTRFrame;

function MockScript(props: ScriptProps) {
  scripts.push(props);
  // As if the script had loaded: next/script calls onReady once ready.
  React.useEffect(() => props.onReady?.(), [props]);
  return <script data-testid="next-script" data-src={props.src} />;
}

before(async () => {
  mock.module("next/script", { defaultExport: MockScript });
  ({ PayTRFrame } = await import("./PayTRFrame"));
});

beforeEach(() => {
  scripts.length = 0;
  resizeCalls.length = 0;
  (window as unknown as { iFrameResize?: unknown }).iFrameResize = (...args: unknown[]) => {
    resizeCalls.push(args);
  };
});

afterEach(() => {
  cleanup();
  delete (window as unknown as { iFrameResize?: unknown }).iFrameResize;
});

describe("PayTRFrame height follows PayTR's content (official resizer)", () => {
  it("loads PayTR's resizer once and hands it the frame, as PayTR's docs show", () => {
    const { container } = render(
      <PayTRFrame iframeUrl="https://www.paytr.com/odeme/guvenli/abc123token" />
    );

    const iframe = container.querySelector("iframe");
    assert.equal(iframe?.id, "paytriframe");
    assert.equal(scripts.length, 1);
    assert.equal(scripts[0].src, "https://www.paytr.com/js/iframeResizer.min.js");
    assert.deepEqual(resizeCalls, [[{}, "#paytriframe"]]);
    assert.equal(iframe?.hasAttribute("sandbox"), false, "no untested sandbox rules");
    // The 600px floor stays as the fallback if the resizer never runs.
    assert.match(iframe?.className ?? "", /min-h-\[600px\]/);
  });

  it("does nothing, and throws nothing, if the resizer is not there", () => {
    delete (window as unknown as { iFrameResize?: unknown }).iFrameResize;
    render(<PayTRFrame iframeUrl="https://www.paytr.com/odeme/guvenli/abc123token" />);
    assert.equal(scripts.length, 1);
  });

  it("loads no third-party script for an address it refuses", () => {
    render(<PayTRFrame iframeUrl="https://evil.example/odeme/guvenli/x" />);
    assert.equal(scripts.length, 0);
    assert.deepEqual(resizeCalls, []);
  });
});
