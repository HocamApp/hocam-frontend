import type { Metadata } from "next";
import { WisprReferencePage } from "@/components/landing/wispr-reference/WisprReferencePage";

export const metadata: Metadata = {
  title: "Wispr Flow Reference Clone | Hocam",
  description: "A scoped visual reference clone of the Wispr Flow landing page.",
};

export default function Page() {
  return <WisprReferencePage />;
}
