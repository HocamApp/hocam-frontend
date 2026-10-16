import { Suspense } from "react";
import type { Metadata } from "next";

import { ToolsNavbarBridge } from "@/components/yemeksepeti/ToolsNavbarBridge";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ToolsNavbarPage({ searchParams }: { searchParams: { surface?: string } }) {
  const surface = searchParams.surface === "bottom" ? "bottom" : "top";
  return (
    <Suspense fallback={<div style={{ height: surface === "top" ? 120 : 64 }} />}>
      <ToolsNavbarBridge surface={surface} />
    </Suspense>
  );
}
